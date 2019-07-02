 <div align="center">
 <img align="center" width="180" src="https://franciscohodge.com/project-pages/js-library-boilerplate/images/JSLB2Basic2.png" />
  <h2>Javascript Library Boilerplate Basic</h2>
  <blockquote>Minimal Library Starter Kit for your Javascript projects</blockquote>
  <a href="https://travis-ci.org/hodgef/js-library-boilerplate-basic"><img src="https://travis-ci.org/hodgef/js-library-boilerplate-basic.svg?branch=master" /></a> <img src="https://img.shields.io/david/hodgef/js-library-boilerplate-basic.svg" /> <a href="https://david-dm.org/hodgef/js-library-boilerplate-basic?type=dev"><img src="https://img.shields.io/david/dev/hodgef/js-library-boilerplate-basic.svg" /></a> <img src="https://api.dependabot.com/badges/status?host=github&repo=hodgef/js-library-boilerplate-basic" />
 
 #### This is a basic library boilerplate. For a more robust alternative, check out [js-library-boilerplate](https://github.com/hodgef/js-library-boilerplate).

</div>

## ⭐️ Features

- Webpack 4
- Babel 7
- UMD exports, so your library works everywhere.
- Jest unit testing
- Daily [dependabot](https://dependabot.com) dependency updates

## 📦 Getting Started

```
git clone https://github.com/hodgef/js-library-boilerplate-basic.git myLibrary
npm install
```

## 💎 Customization

> Before shipping, make sure to:
1. Edit `LICENSE` file
2. Edit `package.json` information (These will be used to generate the headers for your built files)
3. Edit `library: "MyLibrary"` with your library's export name in `./webpack.config.js`

## 🚀 Deployment
1. `npm publish`
2. Your users can include your library as usual

### npm
```
import MyLibrary from 'my-library';
let libraryInstance = new MyLibrary();
...
```

### self-host/cdn
```
<script src="build/index.js"></script>

let MyLibrary = window.MyLibrary.default;
let libraryInstance = new MyLibrary();
...
```

> **Note:** In this minimal version, any images and css files you import will be added to the js bundle. If you want them as separate files, you can use [js-library-boilerplate](https://github.com/hodgef/js-library-boilerplate) or edit the Webpack config accordingly.

## ✅ Libraries built with this boilerplate

> Made a library using this starter kit? Share it here by [submitting a pull request](https://github.com/hodgef/js-library-boilerplate-basic/pulls)!

- [simple-keyboard-autocorrect](https://github.com/hodgef/simple-keyboard-autocorrect) - Autocorrect module for simple-keyboard
- [simple-keyboard-input-mask](https://github.com/hodgef/simple-keyboard-input-mask) - Input mask module for simple-keyboard
- [simple-keyboard-key-navigation](https://github.com/hodgef/simple-keyboard-key-navigation) - Key navigation module for simple-keyboard
- [swipe-keyboard](https://github.com/hodgef/swipe-keyboard) - Swype type keyboard module for simple-keyboard