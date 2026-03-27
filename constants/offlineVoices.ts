import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { NativeModules, Platform } from 'react-native';

export interface BundledOfflineVoice {
  id: string;
  name: string;
  accent: string;
  description: string;
  speakerId: number;
  modelAsset: number;
  modelFileName: string;
  tokensAsset: number;
  tokensFileName: string;
}

interface OfflineNarrationEngine {
  initialize: (config: string) => Promise<void> | void;
  generateAndPlay: (text: string, speakerId: number, speed: number) => Promise<unknown>;
  generateAndSave: (text: string, path?: string | null, fileType?: 'wav') => Promise<string>;
  deinitialize: () => void;
}

const ESPEAK_DATA_ZIP_ASSET = require('../assets/voices/espeak-ng-data.zip');
const OFFLINE_VOICE_ROOT_URI = `${FileSystem.documentDirectory ?? ''}offline-voices/`;

export const BUNDLED_OFFLINE_VOICES: BundledOfflineVoice[] = [
  {
    id: 'amy',
    name: 'Amy',
    accent: 'US English',
    description: 'Female narrator',
    speakerId: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modelAsset: require('../assets/voices/en_US-amy-medium.onnx'),
    modelFileName: 'en_US-amy-medium.onnx',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    tokensAsset: require('../assets/voices/en_US-amy-medium.tokens.txt'),
    tokensFileName: 'en_US-amy-medium.tokens.txt',
  },
  {
    id: 'ryan',
    name: 'Ryan',
    accent: 'US English',
    description: 'Male narrator',
    speakerId: 0,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modelAsset: require('../assets/voices/en_US-ryan-medium.onnx'),
    modelFileName: 'en_US-ryan-medium.onnx',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    tokensAsset: require('../assets/voices/en_US-ryan-medium.tokens.txt'),
    tokensFileName: 'en_US-ryan-medium.tokens.txt',
  },
];

export const DEFAULT_BUNDLED_VOICE_ID = BUNDLED_OFFLINE_VOICES[0]?.id ?? null;
export const BUNDLED_VOICE_UNAVAILABLE_MESSAGE =
  'These bundled offline voices need a development build or store build. Expo Go cannot run the native voice engine.';

function getZipUnzipper() {
  if (Platform.OS === 'web') return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('react-native-zip-archive') as {
      unzip: (source: string, target: string) => Promise<string>;
    };
    return module.unzip;
  } catch {
    return null;
  }
}

function toNativePath(uri: string) {
  return uri.replace(/^file:\/\//, '');
}

async function ensureDirectory(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
  }
}

async function ensureBundledAssetFile(assetModule: number, destinationUri: string) {
  const info = await FileSystem.getInfoAsync(destinationUri);
  if (info.exists) {
    return;
  }

  const asset = Asset.fromModule(assetModule);
  await asset.downloadAsync();

  if (!asset.localUri) {
    throw new Error('A bundled narration file could not be loaded.');
  }

  await FileSystem.copyAsync({
    from: asset.localUri,
    to: destinationUri,
  });
}

async function ensureEspeakDataDirectory(rootUri: string) {
  const espeakDirUri = `${rootUri}espeak-ng-data/`;
  const info = await FileSystem.getInfoAsync(espeakDirUri);
  if (info.exists) {
    return espeakDirUri;
  }

  const unzip = getZipUnzipper();
  if (!unzip) {
    throw new Error(BUNDLED_VOICE_UNAVAILABLE_MESSAGE);
  }

  const zipAsset = Asset.fromModule(ESPEAK_DATA_ZIP_ASSET);
  await zipAsset.downloadAsync();

  if (!zipAsset.localUri) {
    throw new Error('Bundled speech data could not be prepared.');
  }

  await ensureDirectory(rootUri);
  await unzip(toNativePath(zipAsset.localUri), toNativePath(rootUri));

  return espeakDirUri;
}

export function getBundledVoiceById(voiceId: string | null | undefined) {
  return BUNDLED_OFFLINE_VOICES.find((voice) => voice.id === voiceId) ?? BUNDLED_OFFLINE_VOICES[0];
}

export function getBundledNarrationEngine(): OfflineNarrationEngine | null {
  if (Platform.OS === 'web' || !NativeModules.TTSManager) {
    return null;
  }

  try {
    const nativeTts = NativeModules.TTSManager as {
      addListener?: (eventName: string) => void;
      removeListeners?: (count: number) => void;
    };

    if (typeof nativeTts.addListener !== 'function') {
      nativeTts.addListener = () => {};
    }

    if (typeof nativeTts.removeListeners !== 'function') {
      nativeTts.removeListeners = () => {};
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-sherpa-onnx-offline-tts').default as OfflineNarrationEngine;
  } catch {
    return null;
  }
}

export function isBundledNarrationSupported() {
  return getBundledNarrationEngine() !== null;
}

export async function prepareBundledVoiceConfig(voice: BundledOfflineVoice) {
  if (!FileSystem.documentDirectory) {
    throw new Error('Local file storage is not available on this device.');
  }

  await ensureDirectory(OFFLINE_VOICE_ROOT_URI);

  const voiceDirectoryUri = `${OFFLINE_VOICE_ROOT_URI}${voice.id}/`;
  await ensureDirectory(voiceDirectoryUri);

  const modelUri = `${voiceDirectoryUri}${voice.modelFileName}`;
  const tokensUri = `${voiceDirectoryUri}${voice.tokensFileName}`;

  await Promise.all([
    ensureBundledAssetFile(voice.modelAsset, modelUri),
    ensureBundledAssetFile(voice.tokensAsset, tokensUri),
  ]);

  const espeakDirUri = await ensureEspeakDataDirectory(OFFLINE_VOICE_ROOT_URI);

  return JSON.stringify({
    modelPath: toNativePath(modelUri),
    tokensPath: toNativePath(tokensUri),
    dataDirPath: toNativePath(espeakDirUri),
  });
}
