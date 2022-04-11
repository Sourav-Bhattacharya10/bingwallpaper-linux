import * as constants from './constants';

let initialState = {
    isApiCalling: false,
    isApiCalled: false,
    isApiFailed: false,
    imageBasePath: "",
    images: [],
    isDailyRefreshEnabled: false,
    errors: []
}

export const getImagesReducer = (state = initialState, action) => {
    switch (action.type) {
        case constants.GET_IMAGES_REQUEST: 
            return {
                ...state,
                isApiCalling: true,
                isApiCalled: false,
                isApiFailed: false,
                imageBasePath: "",
                images: [],
                isDailyRefreshEnabled: false,
                errors: []
            };
        case constants.GET_IMAGES_SUCCESS:
            return {
                ...state,
                isApiCalling: false,
                isApiCalled: true,
                isApiFailed: false,
                imageBasePath: action.response.imageBasePath,
                images: action.response.imageList,
                isDailyRefreshEnabled: action.response.isDailyRefreshEnabled,
                errors: []
            };
        case constants.GET_IMAGES_FAILED:
            return {
                ...state,
                isApiCalling: false,
                isApiCalled: false,
                isApiFailed: true,
                imageBasePath: "",
                images: [],
                isDailyRefreshEnabled: false,
                errors: action.error
            };
        default: 
            return state;
    }
}