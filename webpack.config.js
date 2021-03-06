var webpack = require('webpack');
var path = require('path');

// variables
var isProduction = process.argv.indexOf('-p') >= 0;
var isPreview = process.argv.indexOf('--pv') >= 0;
var sourcePath = path.join(__dirname, './src');
var outPath = isPreview ? path.join(__dirname, './preview'):  path.join(__dirname, './dist');

// plugins
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var WebpackCleanupPlugin = require('webpack-cleanup-plugin');
var StyleLintPlugin = require('stylelint-webpack-plugin');
// var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const pkg = require('./package.json');

var webpackConfig;

webpackConfig = {
  context: sourcePath,
  output: {
    path: outPath ,
    filename: `[name]${isProduction ? '.min' : ''}.js`,
    // chunkFilename: '[chunkhash].js',
    publicPath: '/',
    libraryExport: "default",
    library: "SlideCaptcha",
    libraryTarget: "umd"
  },
  target: 'web',
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
    mainFields: ['module', 'browser', 'main'],
    alias: {}
  },
  module: {
    rules: [
      // .ts, .tsx
      {
        test: /\.tsx?$/,
        use: isProduction
            ? 'ts-loader'
            : ['babel-loader', 'ts-loader']
      },

      {
        test: /\.js|tsx$/,
        exclude: [/\node_modules/, /\.json$/],
        enforce: "pre",
        loader: "tslint-loader"
      },
      // static assets
      { test: /\.html$/, use: 'html-loader' },
      {
        test:  /\.(?:ico|gif|png|jpg|jpeg|webp|svg)$/i,
        loader: 'url-loader?limit=200000',
        options: {
          name: '[path][name].[ext]',
          publicPath: './',
          outputPath: './assets/img/',
        }
      },
    ]
  },
  optimization: {
    splitChunks: {
      name: true,
      cacheGroups: {
        commons: {
          chunks: 'initial',
          minChunks: 2
        },
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          chunks: 'all',
          priority: -10
        }
      }
    },
    runtimeChunk: false
  },
  plugins: [
    new WebpackCleanupPlugin(),
    new ExtractTextPlugin({
      filename: 'styles.css',
      // disable: isProduction
    }),
    new StyleLintPlugin({
        context: "src",
        configFile: '.stylelintrc.js',
        files: '**/*.less',
        failOnError: false,
        quiet: false,
        syntax: 'less'
      }
    ),
    // new BundleAnalyzerPlugin(),
  ],
  devtool: isProduction? 'nosources-source-map' : 'cheap-module-eval-source-map',
  node: {
    // workaround for webpack-dev-server issue
    // https://github.com/webpack/webpack-dev-server/issues/60#issuecomment-103411179
    fs: 'empty',
    net: 'empty'
  },
};
// dev config
if (!isProduction && !isPreview) {
  webpackConfig.entry = {
    slideCaptcha: './demo/index.tsx'
  };
  webpackConfig.module.rules.push(
    {
      test: /\.css|less$/,
      include: [path.resolve('node_modules/prismjs'), path.resolve('src/')],
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          query: {
            modules: false,
            sourceMap: true,
            importLoaders: 1,
            localIdentName: '[local]__[hash:base64:5]'
          }
        },
        {
          loader: "less-loader",
          query: {
            modules: false,
            sourceMap: true,
            importLoaders: 1,
            localIdentName: '[local]__[hash:base64:5]'
          }
        },
        {
          loader: 'postcss-loader',
          options: {
            ident: 'postcss',
            plugins: [
              require('postcss-import')({ addDependencyTo: webpack }),
              require('postcss-url')(),
              require('autoprefixer')({
                flexbox: true,
              }),
              require('postcss-reporter')(),
            ]
          }
        }
      ]
    }
  );
  webpackConfig.plugins.push(
    new HtmlWebpackPlugin({
      template: '../index.html',
    }),
  );

  webpackConfig.devServer = {
    contentBase: sourcePath,
    hot: true,
    inline: true,
    historyApiFallback: {
      disableDotRule: true
    },
    stats: 'minimal'
  }
// preview config
} else if(isPreview && isProduction) {

  webpackConfig.entry = {
    slideCaptcha: './demo/index.tsx'
  };

  webpackConfig.output.publicPath = './';

  webpackConfig.module.rules.push(
    {
      test: /\.css|less$/,
      include: [path.resolve('node_modules/prismjs'), path.resolve('src/')],
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          query: {
            modules: false,
            sourceMap: true,
            importLoaders: 1,
            localIdentName: '[local]__[hash:base64:5]'
          }
        },
        {
          loader: "less-loader",
          query: {
            modules: false,
            sourceMap: true,
            importLoaders: 1,
            localIdentName: '[local]__[hash:base64:5]'
          }
        },
        {
          loader: 'postcss-loader',
          options: {
            ident: 'postcss',
            plugins: [
              require('postcss-import')({ addDependencyTo: webpack }),
              require('postcss-url')(),
              require('autoprefixer')({
                browsers: pkg.browserslist,
                flexbox: true,
              }),
              require('postcss-reporter')(),
            ]
          }
        }
      ]
    }
  );
  webpackConfig.plugins.push(
    new HtmlWebpackPlugin({
      template: '../index.html',
    }),
  );
// prodction config
} else if(!isPreview && isProduction) {
  webpackConfig.entry = {
    slideCaptcha: './index.tsx'
  };

  webpackConfig.module.rules.push(
    {
      test: /\.css|less$/,
      exclude: [path.resolve('node_modules')],
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            query: {
              modules: false,
              sourceMap: false,
              importLoaders: 1,
              localIdentName: '[local]__[hash:base64:5]'
            }
          },
          {
            loader: "less-loader",
            query: {
              modules: false,
              sourceMap: false,
              importLoaders: 1,
              localIdentName: '[local]__[hash:base64:5]'
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: [
                require('postcss-import')({ addDependencyTo: webpack }),
                require('postcss-url')(),
                require('postcss-reporter')(),
              ]
            }
          }
        ]
      })
    },
  );
  webpackConfig.externals = {
    react: {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react',
      umd: 'react',
    },
    'react-dom': {
      root: 'ReactDOM',
      commonjs2: 'react-dom',
      commonjs: 'react-dom',
      amd: 'react-dom',
      umd: 'react-dom',
    },
  };
  // webpackConfig.plugins.push(
  //   new BundleAnalyzerPlugin(),
  // );
}

module.exports = webpackConfig;
