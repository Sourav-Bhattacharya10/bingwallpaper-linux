import {combineReducers} from "redux";
import {getImagesReducer} from './containers/reducers';

const rootReducer = combineReducers({
    images: getImagesReducer
})

export default rootReducer;