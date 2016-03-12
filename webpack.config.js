module.exports = {
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: 'style!css'
      },
      {
        test: /\.(?:gif|ico|jpg|jpeg|png)$/,
        loader: 'file?name=img/[hash:6].[ext]'
      },
      {
        test: /\.modernizrrc$/,
        loader: 'modernizr'
      },
      {
        test: /\.js-disabled$/,
        loader: 'uglify'
      }
    ]
  },
  resolve: {
    alias: {
      modernizr$: './.modernizrrc'
    }
  }
}
