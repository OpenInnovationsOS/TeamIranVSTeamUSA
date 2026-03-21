const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { WorkboxPlugin } = require('workbox-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isAnalyze = env && env.analyze;

  return {
    mode: isProduction ? 'production' : 'development',
    entry: {
      main: './frontend/src/index.js',
      vendor: ['react', 'react-dom', 'framer-motion', 'styled-components']
    },
    output: {
      path: path.resolve(__dirname, 'dist/static'),
      filename: isProduction ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
      chunkFilename: isProduction ? 'js/[name].[contenthash:8].chunk.js' : 'js/[name].chunk.js',
      publicPath: '/static/',
      clean: true
    },
    optimization: {
      minimize: isProduction,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            enforce: true
          }
        }
      },
      runtimeChunk: {
        name: 'runtime',
        enforce: true
      }
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ['> 1%', 'last 2 versions', 'not dead']
                  },
                  modules: false,
                  useBuiltIns: 'usage',
                  corejs: 3
                }],
                '@babel/preset-react'
              ],
              plugins: [
                '@babel/plugin-syntax-dynamic-import',
                '@babel/plugin-proposal-class-properties',
                '@babel/plugin-proposal-object-rest-spread'
              ],
              cacheDirectory: true
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                modules: false,
                localIdentName: '[name]__[local]___[hash:base64:5]'
              }
            }
          ]
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 8192,
                name: 'images/[name].[hash:8].[ext]',
                publicPath: '/static/images/'
              }
            }
          ]
        },
        {
          test: /\.(woff|woff2|eot|ttf)$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 8192,
                name: 'fonts/[name].[hash:8].[ext]',
                publicPath: '/static/fonts/'
              }
            }
          ]
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'frontend/src'),
        '@components': path.resolve(__dirname, 'frontend/src/components'),
        '@hooks': path.resolve(__dirname, 'frontend/src/hooks'),
        '@stores': path.resolve(__dirname, 'frontend/src/stores'),
        '@styles': path.resolve(__dirname, 'frontend/src/styles'),
        '@utils': path.resolve(__dirname, 'frontend/src/utils')
      }
    },
    plugins: [
      new CleanWebpackPlugin({
        cleanStaleWebpackAssets: true,
        protectWebpackAssets: false,
        cleanOnceBeforeBuildPatterns: ['dist/static']
      }),
      
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: 'css/[name].[contenthash:8].css',
          chunkFilename: 'css/[name].[contenthash:8].chunk.css'
        }),
        
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
            },
            mangle: true,
            format: {
              comments: false
            }
          },
          extractComments: false,
          parallel: true
        })
      ] : []),
      
      new HtmlWebpackPlugin({
        template: './frontend/public/index.html',
        filename: '../index.html',
        inject: 'body',
        minify: isProduction,
        templateParameters: {
          isProduction
        }
      }),
      
      new CopyWebpackPlugin({
        patterns: [
          { from: 'frontend/public/manifest.json', to: '../manifest.json' },
          { from: 'frontend/public/icon-192x192.png', to: '../icon-192x192.png' },
          { from: 'frontend/public/icon-512x512.png', to: '../icon-512x512.png' },
          { from: 'frontend/public/sw.js', to: '../sw.js' }
        ]
      }),
      
      ...(isProduction ? [
        new WorkboxPlugin.InjectManifest({
          swSrc: path.resolve(__dirname, 'frontend/public/sw.js'),
          swDest: path.resolve(__dirname, 'dist/sw.js'),
          include: [/\.html$/, /\.js$/, /\.css$/, /\.png$/, /\.jpg$/, /\.svg$/],
          exclude: [/\.map$/, /hot-update\.js$/],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
          dontCacheBustURLsMatching: /\.[a-f0-9]{8}\./
        })
      ] : []),
      
      ...(isAnalyze ? [
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: true,
          reportFilename: 'bundle-report.html'
        })
      ] : [])
    ],
    
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    },
    
    stats: {
      colors: true,
      modules: true,
      reasons: true,
      errorDetails: true,
      chunks: true,
      assets: true
    }
  };
};
