import * as constants from './constants';

export const getImages = () => {
    return async (dispatch) => {
        dispatch({type: constants.GET_IMAGES_REQUEST})

        try {
            let result = await electronContextBridge.reactjsApi.getDataFromMain();
            console.log("getData : ", result)
            result.imageList = await loadImages(result.imageBasePath, result.imageList)
            dispatch({type: constants.GET_IMAGES_SUCCESS, response: result})
        } catch (error) {
            console.log("action error : ", error)
            dispatch({type: constants.GET_IMAGES_FAILED, error: error})
        }
    }
}

const loadImages = async(imageBasePath, images) => {
    images = await Promise.all(images.map(async(image) => {
        let fpath = `${imageBasePath}/${image.startdate}.jpg`
        const src = await electronContextBridge.reactjsApi.importImageFile(fpath);
        image.src = src;
        return image;
    }))

    return images
}

// const loadImages = (imageBasePath, images) => {
//     images = images.map((image) => {
//         let fpath = `${imageBasePath}/${image.startdate}.jpg`
//         const src = require(fpath).default;
//         image.src = src;
//         return image;
//     })

//     return images
// }