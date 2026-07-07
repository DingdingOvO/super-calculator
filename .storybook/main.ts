import type { StorybookConfig } from '@storybook/react';

const config: StorybookConfig = {
  stories: ['../.storybook/stories/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/react',
    options: {
      builder: {
        name: '@storybook/builder-webpack5',
        options: {
          fsCache: true,
          lazyCompilation: true,
        },
      },
    },
  },
  staticDirs: ['../public'],
};

export default config;
