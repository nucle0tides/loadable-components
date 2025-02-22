(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react'), require('hoist-non-react-statics')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react', 'hoist-non-react-statics'], factory) :
  (global = global || self, factory(global.loadable = {}, global.React, global.hoistNonReactStatics));
}(this, function (exports, React, hoistNonReactStatics) { 'use strict';

  React = React && React.hasOwnProperty('default') ? React['default'] : React;
  hoistNonReactStatics = hoistNonReactStatics && hoistNonReactStatics.hasOwnProperty('default') ? hoistNonReactStatics['default'] : hoistNonReactStatics;

  /* eslint-disable import/prefer-default-export */
  function invariant(condition, message) {
    if (condition) return;
    var error = new Error("loadable: " + message);
    error.framesToPop = 1;
    error.name = 'Invariant Violation';
    throw error;
  }
  function warn(message) {
    // eslint-disable-next-line no-console
    console.warn("loadable: " + message);
  }

  var Context = /*#__PURE__*/
  React.createContext();

  var LOADABLE_REQUIRED_CHUNKS_KEY = '__LOADABLE_REQUIRED_CHUNKS__';
  function getRequiredChunkKey(namespace) {
    return "" + namespace + LOADABLE_REQUIRED_CHUNKS_KEY;
  }

  var sharedInternals = /*#__PURE__*/Object.freeze({
    getRequiredChunkKey: getRequiredChunkKey,
    invariant: invariant,
    Context: Context
  });

  function _objectWithoutPropertiesLoose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;

    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }

    return target;
  }

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }

  function resolveConstructor(ctor) {
    if (typeof ctor === 'function') {
      return {
        requireAsync: ctor
      };
    }

    return ctor;
  }

  var withChunkExtractor = function withChunkExtractor(Component) {
    return function (props) {
      return React.createElement(Context.Consumer, null, function (extractor) {
        return React.createElement(Component, Object.assign({
          __chunkExtractor: extractor
        }, props));
      });
    };
  };

  var identity = function identity(v) {
    return v;
  };

  function createLoadable(_ref) {
    var _ref$resolve = _ref.resolve,
        resolve = _ref$resolve === void 0 ? identity : _ref$resolve,
        _render = _ref.render,
        onLoad = _ref.onLoad;

    function loadable(loadableConstructor, options) {
      if (options === void 0) {
        options = {};
      }

      console.log(loadableConstructor);
      console.log(loadableConstructor.chunkName());
      var ctor;

      try {
        ctor = resolveConstructor(loadableConstructor);
      } catch (err) {
        throw new Error(err);
      }

      var cache = {};

      function _getCacheKey(props) {
        if (options.cacheKey) {
          return options.cacheKey(props);
        }

        if (ctor.resolve) {
          return ctor.resolve(props);
        }

        return null;
      }

      var InnerLoadable =
      /*#__PURE__*/
      function (_React$Component) {
        _inheritsLoose(InnerLoadable, _React$Component);

        InnerLoadable.getDerivedStateFromProps = function getDerivedStateFromProps(props, state) {
          var cacheKey = _getCacheKey(props);

          return _extends({}, state, {
            cacheKey: cacheKey,
            loading: state.loading || state.cacheKey !== cacheKey
          });
        };

        function InnerLoadable(props) {
          var _this;

          _this = _React$Component.call(this, props) || this;
          _this.state = {
            result: null,
            error: null,
            loading: true,
            cacheKey: _getCacheKey(props)
          };
          _this.promise = null;
          invariant(!props.__chunkExtractor || ctor.requireSync, 'SSR requires `@loadable/babel-plugin`, please install it'); // Server-side

          if (props.__chunkExtractor) {
            // This module has been marked with no SSR
            if (options.ssr === false) {
              return _assertThisInitialized(_this);
            } // We run load function, we assume that it won't fail and that it
            // triggers a synchronous loading of the module


            ctor.requireAsync(props)["catch"](function () {}); // So we can require now the module synchronously

            _this.loadSync();

            props.__chunkExtractor.addChunk(ctor.chunkName(props));

            return _assertThisInitialized(_this);
          } // Client-side with `isReady` method present (SSR probably)
          // If module is already loaded, we use a synchronous loading


          if (ctor.isReady && ctor.isReady(props)) {
            _this.loadSync();
          }

          return _this;
        }

        var _proto = InnerLoadable.prototype;

        _proto.componentDidMount = function componentDidMount() {
          this.mounted = true;

          if (this.state.loading) {
            this.loadAsync();
          } else if (!this.state.error) {
            this.triggerOnLoad();
          }
        };

        _proto.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
          // Component is reloaded if the cacheKey has changed
          if (prevState.cacheKey !== this.state.cacheKey) {
            this.promise = null;
            this.loadAsync();
          }
        };

        _proto.componentWillUnmount = function componentWillUnmount() {
          this.mounted = false;
        };

        _proto.safeSetState = function safeSetState(nextState, callback) {
          if (this.mounted) {
            this.setState(nextState, callback);
          }
        };

        _proto.triggerOnLoad = function triggerOnLoad() {
          var _this2 = this;

          if (onLoad) {
            setTimeout(function () {
              onLoad(_this2.state.result, _this2.props);
            });
          }
        };

        _proto.loadSync = function loadSync() {
          if (!this.state.loading) return;

          try {
            var loadedModule = ctor.requireSync(this.props);
            var result = resolve(loadedModule, {
              Loadable: Loadable
            });
            this.state.result = result;
            this.state.loading = false;
          } catch (error) {
            this.state.error = error;
            throw new Error(error);
          }
        };

        _proto.getCacheKey = function getCacheKey() {
          return _getCacheKey(this.props) || JSON.stringify(this.props);
        };

        _proto.getCache = function getCache() {
          return cache[this.getCacheKey()];
        };

        _proto.setCache = function setCache(value) {
          cache[this.getCacheKey()] = value;
        };

        _proto.loadAsync = function loadAsync() {
          var _this3 = this;

          if (!this.promise) {
            var _this$props = this.props,
                __chunkExtractor = _this$props.__chunkExtractor,
                forwardedRef = _this$props.forwardedRef,
                props = _objectWithoutPropertiesLoose(_this$props, ["__chunkExtractor", "forwardedRef"]);

            this.promise = ctor.requireAsync(props).then(function (loadedModule) {
              var result = resolve(loadedModule, {
                Loadable: Loadable
              });

              if (options.suspense) {
                _this3.setCache(result);
              }

              _this3.safeSetState({
                result: resolve(loadedModule, {
                  Loadable: Loadable
                }),
                loading: false
              }, function () {
                return _this3.triggerOnLoad();
              });
            })["catch"](function (error) {
              _this3.safeSetState({
                error: error,
                loading: false
              });
            });
          }

          return this.promise;
        };

        _proto.render = function render() {
          var _this$props2 = this.props,
              forwardedRef = _this$props2.forwardedRef,
              propFallback = _this$props2.fallback,
              __chunkExtractor = _this$props2.__chunkExtractor,
              props = _objectWithoutPropertiesLoose(_this$props2, ["forwardedRef", "fallback", "__chunkExtractor"]);

          var _this$state = this.state,
              error = _this$state.error,
              loading = _this$state.loading,
              result = _this$state.result;

          if (options.suspense) {
            var cachedResult = this.getCache();
            if (!cachedResult) throw this.loadAsync();
            return _render({
              loading: false,
              fallback: null,
              result: cachedResult,
              options: options,
              props: _extends({}, props, {
                ref: forwardedRef
              })
            });
          }

          if (error) {
            throw error;
          }

          var fallback = propFallback || options.fallback || null;

          if (loading) {
            return fallback;
          }

          return _render({
            loading: loading,
            fallback: fallback,
            result: result,
            options: options,
            props: _extends({}, props, {
              ref: forwardedRef
            })
          });
        };

        return InnerLoadable;
      }(React.Component);

      var EnhancedInnerLoadable = withChunkExtractor(InnerLoadable);
      var Loadable = React.forwardRef(function (props, ref) {
        return React.createElement(EnhancedInnerLoadable, Object.assign({
          forwardedRef: ref
        }, props));
      }); // In future, preload could use `<link rel="preload">`

      Loadable.preload = function (props) {
        ctor.requireAsync(props);
      };

      Loadable.load = function (props) {
        return ctor.requireAsync(props);
      };

      return Loadable;
    }

    function lazy(ctor, options) {
      return loadable(ctor, _extends({}, options, {
        suspense: true
      }));
    }

    return {
      loadable: loadable,
      lazy: lazy
    };
  }

  function resolveComponent(loadedModule, _ref) {
    var Loadable = _ref.Loadable;
    // eslint-disable-next-line no-underscore-dangle
    var Component = loadedModule.__esModule ? loadedModule["default"] : loadedModule["default"] || loadedModule;
    console.log("!!!!!");
    console.log(Component);
    console.log(Loadable);

    try {
      console.log(hoistNonReactStatics(Loadable, Component, {
        preload: true
      }));
    } catch (err) {
      throw new Error(err);
      console.log(err);
    }

    return Component;
  }

  /* eslint-disable no-use-before-define, react/no-multi-comp */

  var _createLoadable =
  /*#__PURE__*/
  createLoadable({
    resolve: resolveComponent,
    render: function render(_ref) {
      var Component = _ref.result,
          props = _ref.props;
      return React.createElement(Component, props);
    }
  }),
      loadable = _createLoadable.loadable,
      lazy = _createLoadable.lazy;

  /* eslint-disable no-use-before-define, react/no-multi-comp */

  var _createLoadable$1 =
  /*#__PURE__*/
  createLoadable({
    onLoad: function onLoad(result, props) {
      if (result && props.forwardedRef) {
        if (typeof props.forwardedRef === 'function') {
          props.forwardedRef(result);
        } else {
          props.forwardedRef.current = result;
        }
      }
    },
    render: function render(_ref) {
      var result = _ref.result,
          loading = _ref.loading,
          props = _ref.props;

      if (!loading && props.children) {
        return props.children(result);
      }

      return null;
    }
  }),
      loadable$1 = _createLoadable$1.loadable,
      lazy$1 = _createLoadable$1.lazy;

  /* eslint-disable no-underscore-dangle, camelcase */
  var BROWSER = typeof window !== 'undefined';
  function loadableReady(done, _temp) {
    if (done === void 0) {
      done = function done() {};
    }

    var _ref = _temp === void 0 ? {} : _temp,
        _ref$namespace = _ref.namespace,
        namespace = _ref$namespace === void 0 ? '' : _ref$namespace;

    if (!BROWSER) {
      warn('`loadableReady()` must be called in browser only');
      done();
      return Promise.resolve();
    }

    var requiredChunks = null;

    if (BROWSER) {
      var dataElement = document.getElementById(getRequiredChunkKey(namespace));

      if (dataElement) {
        requiredChunks = JSON.parse(dataElement.textContent);
      }
    }

    if (!requiredChunks) {
      warn('`loadableReady()` requires state, please use `getScriptTags` or `getScriptElements` server-side');
      done();
      return Promise.resolve();
    }

    var resolved = false;
    return new Promise(function (resolve) {
      console.log(window);
      if (!window) console.error("window is not defined");
      window.__LOADABLE_LOADED_CHUNKS__ = window.__LOADABLE_LOADED_CHUNKS__ || [];
      var loadedChunks = window.__LOADABLE_LOADED_CHUNKS__;
      var originalPush = loadedChunks.push.bind(loadedChunks);

      function checkReadyState() {
        if (requiredChunks.every(function (chunk) {
          return loadedChunks.some(function (_ref2) {
            var chunks = _ref2[0];
            return chunks.indexOf(chunk) > -1;
          });
        })) {
          if (!resolved) {
            resolved = true;
            resolve();
            done();
          }
        }
      }

      loadedChunks.push = function () {
        originalPush.apply(void 0, arguments);
        checkReadyState();
      };

      checkReadyState();
    });
  }

  /* eslint-disable no-underscore-dangle */
  var loadable$2 = loadable;
  loadable$2.lib = loadable$1;
  var lazy$2 = lazy;
  lazy$2.lib = lazy$1;
  var __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = sharedInternals;

  exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  exports.default = loadable$2;
  exports.lazy = lazy$2;
  exports.loadableReady = loadableReady;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
