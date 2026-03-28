# Nūr

Premium Islamic reader built with Expo Router and React Native.

## Run

```bash
npm install
npx expo start -c
```

## Main Areas

- `app/` routes and screens
- `components/` shared UI
- `constants/chapters/` content collections
- `constants/content.ts` library wiring
- `context/` app state and settings

## Notes

- Offline reading data is stored locally on device.
- Native narration features require a development build or store build for full support.
- Theme purchases and store billing should be wired to real App Store / Play Billing before release.
