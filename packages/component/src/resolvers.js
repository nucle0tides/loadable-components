import hoistNonReactStatics from 'hoist-non-react-statics'

export function resolveComponent(loadedModule, { Loadable }) {
  // eslint-disable-next-line no-underscore-dangle
  const Component = loadedModule.__esModule ? loadedModule.default : (loadedModule.default || loadedModule)
  console.log("!!!!!");
  console.log(Component);
  console.log(Loadable)
  try {
    console.log(
      hoistNonReactStatics(Loadable, Component, {
          preload: true,
      })
    );
  } catch (err) {
    console.log(err);
  }
  return Component;
}
