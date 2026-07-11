import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { loadRuntimeConfig, RUNTIME_CONFIG } from './app/runtime-config';

loadRuntimeConfig()
  .then((runtimeConfig) =>
    bootstrapApplication(App, {
      ...appConfig,
      providers: [
        ...(appConfig.providers ?? []),
        { provide: RUNTIME_CONFIG, useValue: runtimeConfig },
      ],
    }),
  )
  .catch((err) => console.error(err));
