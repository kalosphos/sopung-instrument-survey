export const defaultState = {
  config: {
    title: "소풍 치배구성 조사",
    startsAt: "",
    notice: "참여할 악기와 별명을 남겨주세요.",
    instruments: [
      { id: "guitar", name: "기타", maxBorrow: 2 },
      { id: "cajon", name: "카혼", maxBorrow: 1 },
      { id: "keyboard", name: "건반", maxBorrow: 1 },
    ],
  },
  responses: [],
};

export function normalizeState(state) {
  return {
    config: {
      ...defaultState.config,
      ...(state?.config || {}),
      instruments: Array.isArray(state?.config?.instruments)
        ? state.config.instruments
        : defaultState.config.instruments,
    },
    responses: Array.isArray(state?.responses) ? state.responses : [],
  };
}
