// The tag Vite baked into this build from VITE_BUILD_TAG ("" when it was unset at build time).
export const BAKED_TAG: string = import.meta.env.VITE_BUILD_TAG ?? "";

export const info = {
  name: "remix-router",
  stack: "React Router 7 SSR",
  build: { tag: BAKED_TAG || undefined, built_at: __BUILT_AT__ },
};
