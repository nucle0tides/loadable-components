/* eslint-disable no-use-before-define, react/no-multi-comp, no-underscore-dangle */
import React from 'react'
import { invariant } from './util'
import Context from './Context'

function resolveConstructor(ctor) {
  if (typeof ctor === 'function') {
    return { requireAsync: ctor }
  }

  return ctor
}

const withChunkExtractor = Component => props => (
  <Context.Consumer>
    {extractor => <Component __chunkExtractor={extractor} {...props} />}
  </Context.Consumer>
)

const identity = v => v

function createLoadable({ resolve = identity, render, onLoad }) {
  function loadable(loadableConstructor, options = {}) {
    console.log(loadableConstructor);
    console.log(loadableConstructor.chunkName());
    let ctor;
    try {
      ctor = resolveConstructor(loadableConstructor)
    } catch (err) {
      throw new Error(err)
    }
    const cache = {}
    function getCacheKey(props) {
      if (options.cacheKey) {
        return options.cacheKey(props)
      }
      if (ctor.resolve) {
        return ctor.resolve(props)
      }
      return null
    }

    class InnerLoadable extends React.Component {
      static getDerivedStateFromProps(props, state) {
        const cacheKey = getCacheKey(props)
        return {
          ...state,
          cacheKey,
          loading: state.loading || state.cacheKey !== cacheKey,
        }
      }

      constructor(props) {
        super(props)

        this.state = {
          result: null,
          error: null,
          loading: true,
          cacheKey: getCacheKey(props),
        }

        this.promise = null

        invariant(
          !props.__chunkExtractor || ctor.requireSync,
          'SSR requires `@loadable/babel-plugin`, please install it',
        )

        // Server-side
        if (props.__chunkExtractor) {
          // This module has been marked with no SSR
          if (options.ssr === false) {
            return
          }

          // We run load function, we assume that it won't fail and that it
          // triggers a synchronous loading of the module
          ctor.requireAsync(props).catch(() => {})

          // So we can require now the module synchronously
          this.loadSync()

          props.__chunkExtractor.addChunk(ctor.chunkName(props))
          return
        }

        // Client-side with `isReady` method present (SSR probably)
        // If module is already loaded, we use a synchronous loading
        if (ctor.isReady && ctor.isReady(props)) {
          this.loadSync()
        }
      }

      componentDidMount() {
        this.mounted = true

        if (this.state.loading) {
          this.loadAsync()
        } else if (!this.state.error) {
          this.triggerOnLoad()
        }
      }

      componentDidUpdate(prevProps, prevState) {
        // Component is reloaded if the cacheKey has changed
        if (prevState.cacheKey !== this.state.cacheKey) {
          this.promise = null
          this.loadAsync()
        }
      }

      componentWillUnmount() {
        this.mounted = false
      }

      safeSetState(nextState, callback) {
        if (this.mounted) {
          this.setState(nextState, callback)
        }
      }

      triggerOnLoad() {
        if (onLoad) {
          setTimeout(() => {
            onLoad(this.state.result, this.props)
          })
        }
      }

      loadSync() {
        if (!this.state.loading) return

        try {
          const loadedModule = ctor.requireSync(this.props)
          const result = resolve(loadedModule, { Loadable })
          this.state.result = result
          this.state.loading = false
        } catch (error) {
          this.state.error = error
          throw new Error(error);
        }
      }

      getCacheKey() {
        return getCacheKey(this.props) || JSON.stringify(this.props)
      }

      getCache() {
        return cache[this.getCacheKey()]
      }

      setCache(value) {
        cache[this.getCacheKey()] = value
      }

      loadAsync() {
        if (!this.promise) {
          const { __chunkExtractor, forwardedRef, ...props } = this.props
          this.promise = ctor
            .requireAsync(props)
            .then(loadedModule => {
              const result = resolve(loadedModule, { Loadable })
              if (options.suspense) {
                this.setCache(result)
              }
              this.safeSetState(
                {
                  result: resolve(loadedModule, { Loadable }),
                  loading: false,
                },
                () => this.triggerOnLoad(),
              )
            })
            .catch(error => {
              this.safeSetState({ error, loading: false })
            })
        }

        return this.promise
      }

      render() {
        const {
          forwardedRef,
          fallback: propFallback,
          __chunkExtractor,
          ...props
        } = this.props
        const { error, loading, result } = this.state

        if (options.suspense) {
          const cachedResult = this.getCache()
          if (!cachedResult) throw this.loadAsync()
          return render({
            loading: false,
            fallback: null,
            result: cachedResult,
            options,
            props: { ...props, ref: forwardedRef },
          })
        }

        if (error) {
          throw error
        }

        const fallback = propFallback || options.fallback || null

        if (loading) {
          return fallback
        }

        return render({
          loading,
          fallback,
          result,
          options,
          props: { ...props, ref: forwardedRef },
        })
      }
    }

    const EnhancedInnerLoadable = withChunkExtractor(InnerLoadable)
    const Loadable = React.forwardRef((props, ref) => (
      <EnhancedInnerLoadable forwardedRef={ref} {...props} />
    ))

    // In future, preload could use `<link rel="preload">`
    Loadable.preload = props => {
      ctor.requireAsync(props)
    }

    Loadable.load = props => ctor.requireAsync(props)

    return Loadable
  }

  function lazy(ctor, options) {
    return loadable(ctor, { ...options, suspense: true })
  }

  return { loadable, lazy }
}

export default createLoadable
