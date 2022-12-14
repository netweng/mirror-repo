// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");
const webpack = require("webpack");
const versions = require("./versions.json");

if(!process.env.TAURI_ENV) {
  process.env = new Proxy(process.env, {
    get(target, prop) {
      if(prop === 'NODE_ENV') {
        return 'development'
      }
      return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop]
    }
  })
}

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "CloudTower API",
  url: "https://www.smartx.com/",
  baseUrl: "/",
  favicon: "img/favicon.ico",
  organizationName: "SmartX", // Usually your GitHub org/user name.
  projectName: "CloudTower APIs", // Usually your repo name.
  i18n: {
    defaultLocale: "zh",
    locales: ["zh", "en"],
  },
  onBrokenLinks: "log",
  presets: [
    [
      "@docusaurus/preset-classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: "/",
          routeBasePath: "/",
          // editUrl: "https://github.com/facebook/docusaurus/edit/main/website/",
          lastVersion: versions[0],
          includeCurrentVersion: false,
        },
        blog: false,
        pages: false,
        theme: {
          customCss: [require.resolve("./swagger/overwrite.css")],
        },
      }),
    ],
  ],
  plugins: [
    (context, opts) => {
      return {
        name: "overwrite-config",
        configureWebpack(config, isServer, utils, content) {
          return {
            ...(!process.env.TAURI_ENV && {
              output: {
                ...config.output,
                filename: '[name].[contenthash:8].js' ,
                chunkFilename: '[name].[contenthash:8].js',
              },
            }),
            plugins: [
              new webpack.ProvidePlugin({
                process: "process/browser.js",
              }),
            ],
            resolve: {
              fallback: {
                stream: require.resolve("stream-browserify"),
                util:  require.resolve("util/"),
                path: require.resolve("path-browserify"),
                os: require.resolve("os-browserify/browser"),
                tty: require.resolve("tty-browserify"),
                fs: false,
                http: require.resolve("stream-http")
              },
            },
          };
        },
      };
    },
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        logo: {
          alt: "Smartx - Make IT simple",
          src: "img/smartx.svg",
        },
        items: [
          {
            type: "doc",
            docId: "intro",
            label: "????????????" 
          },
          {
            docId: "api",
            type: "doc",
            label: "CloudTower API",
          },
          {
            label: "??????",
            items: [
              {
                type: "doc",
                docId: "download",
                label: "??????"
              },
              {
                type: "doc",
                docId: "java-sdk",
                label: "CloudTower Java SDK",
              },
              {
                docId: "python-sdk",
                type: "doc",
                label: "CloudTower Python SDK"
              },
              {
                docId: "go-sdk",
                type: "doc",
                label: "CloudTower Go SDK"
              }
            ]
          },
          {
            type: "docsVersionDropdown",
            position: "right",
          },
          {
            type: "localeDropdown",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        copyright: `Copyright ?? ${new Date().getFullYear()} SmartX Inc`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
      colorMode: {
        disableSwitch: true,
        defaultMode: "light",
      }
    })
};

module.exports = config;
