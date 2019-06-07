const webpack = require('webpack');
const path = require('path');
const os = require('os');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const nodeEnv = process.env.NODE_ENV || 'development';
const isDevelopment = nodeEnv === 'development';
const isProduction = nodeEnv === 'production';
const isWinOrLinux = os.platform() === 'win32' || os.platform() === 'linux';

const debugLogInfo = 'webpack config info\n-------------------' +
  '\nnodeEnv: ' + nodeEnv +
  '\nisDevelopment: ' + isDevelopment +
  '\nisProduction: ' + isProduction +
  '\nisWinOrLinux (perf poll & timeout): ' + isWinOrLinux;
console.log('\x1b[36m%s\x1b[0m', debugLogInfo + '\n');

let plugins = [
  // create global constants
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(nodeEnv)
    }
  }),
  // handle HTML template files
  new HtmlWebpackPlugin({
    template: './public/index.html',
    filename: 'index.html',
    excludeChunks: ['test']
  }),
  new MiniCssExtractPlugin({
    filename: '[hash].[name].css',
    chunkFilename: '[hash].[id].css',
  })
];

let rules = [
  {
    // handle JS
    test: /\.(js|jsx)$/,
    exclude: /node_modules/,
    loader: 'babel-loader',
    options: {
      presets: [
        '@babel/preset-env',
        '@babel/preset-react'
      ],
      plugins: [
        '@babel/plugin-syntax-object-rest-spread',
        '@babel/plugin-proposal-class-properties',
        'react-hot-loader/babel',
      ],
      cacheDirectory: true
    }
  },
  {
    test: /\/IndexPage\.jsx$/,
    loader: 'react-hot-loader-loader'
  },
  {
    // handle scss
    test: /\.s?[ac]ss$/,
    use: [
      isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
      {
        loader: 'css-loader',
        options: {
          sourceMap: true
        }
      },
      {
        loader: 'postcss-loader',
        options: {
          plugins: (loader) => [
            require('autoprefixer')({
              browsers: ['> 1%', 'last 2 versions']
            }),
            require('postcss-pxtorem')({
              propList: ['*'],
              mediaQuery: true
            })
          ],
          sourceMap: true
        }
      },
      {
        loader: 'sass-loader',
        options: {
          includePaths: [path.resolve(__dirname, 'src')],
          sourceMap: true
        }
      }
    ]
  },
  {
    // handle images
    test: /\.((png)|(svg)|(jpe?g$)|(gif))$/,
    exclude: [/\.inline\.svg$/],
    loader: 'url-loader',
    options: {
      limit: 10000,
      outputPath: 'static/media/',
      name: '[name].[hash:8].[ext]'
    },
  },
  {
    // handle fonts
    test: /\.((woff)|(woff2)|(eot)|(ttf)|(otf)|(svg))$/,
    exclude: [/\.inline\.svg$/],
    loader: 'file-loader',
    options: {
      outputPath: 'static/media/',
      name: '[name].[hash:8].[ext]',
    },
  },
  {
    // handle inline svgs (as react components)
    test: /\.inline\.svg$/,
    loader: 'svg-react-loader'
  }
];

let config = {
  devtool: isProduction ? '' : 'cheap-module-inline-source-map',
  mode: isDevelopment ? 'development' : 'production',
  node: {
    fs: 'empty'
  },
  entry: {
    index: ['@babel/polyfill', './src/index.jsx']
  },
  output: {
    filename: '[name].[hash:8].js',
    // chunkFilename: '[name].chunk.js',
    path: isDevelopment ? path.resolve(__dirname, 'public') : path.resolve(__dirname, 'build'),
    publicPath: '/',
    // JS worker fix: https://github.com/webpack/webpack/issues/6642
    globalObject: 'this'
  },
  plugins: plugins,
  module: {
    rules: rules
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    modules: [path.resolve(__dirname, 'src'), 'node_modules_private', 'node_modules'],
    alias: {
      webworkify: 'webworkify-webpack-dropin',
    }
  },
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    historyApiFallback: {
      rewrites: [
        {from: /^\/test/, to: '/test/index.html'}
      ]
    },
    watchOptions: {
      ignored: /node_modules/,
      poll: isDevelopment && isWinOrLinux ? 250 : 1000,
      aggregateTimeout: isDevelopment && isWinOrLinux ? 50 : 300
    },
    hot: true,
    host: '0.0.0.0',
    port: 3000,
    compress: true,
    disableHostCheck: true
  }
};

if (isDevelopment) {
  plugins.push(
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  );
}

if (isProduction) {
  config.optimization = {
    runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          enforce: true,
          chunks: 'all'
        }
      }
    },
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
      }),
      new OptimizeCSSAssetsPlugin({})
    ]
  };

  plugins.push(
    new CleanWebpackPlugin('build')
  );
}

module.exports = config;
