import React, { useEffect, useState } from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {Row, Col, Container} from 'react-bootstrap';
import { initializeIcons } from '@fluentui/font-icons-mdl2';
import { mergeStyles, Toggle, IconButton, Label, FontIcon, Link, Separator } from '@fluentui/react';
import {getImages} from './actions';
import 'bootstrap/dist/css/bootstrap.min.css';
import classes from './app.module.css';

initializeIcons();



const iconClass = mergeStyles({
    fontSize: 20
  });

const App = () => {
    const dispatch = useDispatch();
    const [isRefreshEnabled, setIsRefreshEnabled] = useState(false);
    const [isAboutShowed, setIsAboutShowed] = useState(false);
    const [currentImage, setCurrentImage] = useState({});
    const [imageList, setImageList] = useState([]);
    const [isNextDisabled, setIsNextDisabled] = useState(false)
    const [isPreviousDisabled, setIsPreviousDisabled] = useState(false)
    const imagesSelector = useSelector(state => state.images);

    const handleLinkClick = () => {
      electronContextBridge.browserApi.openURLInSystemBrowser("https://www.bing.com");
    }

    const showAboutBingWallpaper = () => {
        setIsAboutShowed(!isAboutShowed);
    }

    const handleImageChange = (action) => {
        let tempImageList = JSON.parse(JSON.stringify(imageList))
        tempImageList.sort((a,b) => a.startdate - b.startdate)

        let currentIndex = tempImageList.findIndex(image => image.startdate === currentImage.startdate)

        if(action === "next"){
            if(currentIndex < tempImageList.length - 1){
                electronContextBridge.reactjsApi.setWallpaper(imagesSelector.imageBasePath, tempImageList[currentIndex + 1].startdate)
                setCurrentImage(tempImageList[currentIndex + 1])

                if(currentIndex + 1 === tempImageList.length - 1){
                    setIsNextDisabled(true)
                }
                else{
                    setIsNextDisabled(false)
                    setIsPreviousDisabled(false)
                }
            }
        }
        else{
            if(currentIndex > 0){
              electronContextBridge.reactjsApi.setWallpaper(imagesSelector.imageBasePath, tempImageList[currentIndex - 1].startdate)
                setCurrentImage(tempImageList[currentIndex - 1])

                if(currentIndex - 1 === 0){
                    setIsPreviousDisabled(true)
                }
                else{
                    setIsNextDisabled(false)
                    setIsPreviousDisabled(false)
                }
            }
        }
    }

    const handleDailyRefresh = (event, checked) => {
        setIsRefreshEnabled(checked);
    }

    useEffect(() => {
        dispatch(getImages());
    }, [])

    useEffect(() => {
        if(imagesSelector.isApiCalled && imagesSelector.images.length > 0){
            let tempImageList = JSON.parse(JSON.stringify(imagesSelector.images))
            tempImageList.sort((a,b) => a.startdate - b.startdate)
            let currentIndex = tempImageList.findIndex(image => image.startdate === tempImageList[tempImageList.length - 1].startdate)
            
            if(currentIndex === 0){
                setIsPreviousDisabled(true)
            }
            else if(currentIndex === tempImageList.length - 1){
                setIsNextDisabled(true)
            }
            else{
                setIsPreviousDisabled(false)
                setIsNextDisabled(false)
            }

            setCurrentImage(tempImageList[tempImageList.length - 1])
            setImageList(tempImageList)
            setIsRefreshEnabled(imagesSelector.isDailyRefreshEnabled)
        }
    }, [imagesSelector.isApiCalled])

    useEffect(() => {
      electronContextBridge.trayApi.trayContextMenuStatus(isRefreshEnabled);
    }, [isRefreshEnabled])

    return (
      <Container className="p-3">
        <div className='d-flex flex-column justify-content-center align-items-center'>
          <Row className="mb-4">
            <Col>
              {
                currentImage.src &&
                <img
                  className={`${classes.whiteFont}`}
                  src={`data:image/png;base64,${currentImage.src}`}
                  alt={currentImage.title}
                  title={currentImage.title}
                  width={480}
                  height={270}
                />
              }
              <p className={`p-3 ${classes.whiteFont} text-center`}>{currentImage.title}</p>
            </Col>
          </Row>
          <Row className={classes.rowWidth}>
            <Col md={4} className={classes.rightPaddingZero}>
              <FontIcon
                iconName="PhotoCollection"
                className={`${iconClass} ${classes.whiteFont}`}
              />
            </Col>
            <Col
              md={4}
              className={`${classes.leftPaddingZero} ${classes.rightPaddingZero}`}
            >
              <Label className={classes.whiteFont}>Change Wallpaper</Label>
            </Col>
            <Col md={4} className={`d-flex ${classes.rightPaddingZero}`}>
              <IconButton
                iconProps={{ iconName: "ChevronLeft" }}
                title="Previous"
                className={classes.whiteFont}
                onClick={() => handleImageChange("previous")}
                disabled={isPreviousDisabled}
              />
              <IconButton
                iconProps={{ iconName: "ChevronRight" }}
                title="Next"
                className={classes.whiteFont}
                onClick={() => handleImageChange("next")}
                disabled={isNextDisabled}
              />
            </Col>
          </Row>
          <Row className={classes.rowWidth}>
            <Col md={4} className={classes.rightPaddingZero}>
              <FontIcon
                iconName="Refresh"
                className={`${iconClass} ${classes.whiteFont}`}
              />
            </Col>
            <Col
              md={4}
              className={`${classes.leftPaddingZero} ${classes.rightPaddingZero}`}
            >
              <Label className={classes.whiteFont}>Enable daily refresh</Label>
            </Col>
            <Col md={4} className={classes.rightPaddingZero}>
              <Toggle
                label=""
                inlineLabel
                onText="On"
                offText="Off"
                className={classes.togglePaddingLeft}
                onChange={handleDailyRefresh}
                checked={isRefreshEnabled}
              />
            </Col>
          </Row>
          <Row className={classes.rowWidth}>
            <Col md={4} className={classes.rightPaddingZero}>
              <FontIcon
                iconName="Forward"
                className={`${iconClass} ${classes.whiteFont}`}
              />
            </Col>
            <Col
              md={4}
              className={`${classes.leftPaddingZero} ${classes.rightPaddingZero}`}
            >
              <Link className={classes.linkClass} onClick={handleLinkClick}>
                <Label
                  className={`${classes.whiteFont} ${classes.cursorPointer}`}
                >
                  Go to Bing.com
                </Label>
              </Link>
            </Col>
          </Row>
          <Row className={classes.rowWidth}>
            <Col md={4} className={classes.rightPaddingZero}>
              <FontIcon
                iconName="BingLogo"
                className={`${iconClass} ${classes.whiteFont}`}
              />
            </Col>
            <Col
              md={4}
              className={`${classes.leftPaddingZero} ${classes.rightPaddingZero}`}
            >
              <Label className={classes.whiteFont}>About Bing Wallpaper</Label>
            </Col>
            <Col md={4} className={classes.rightPaddingZero}>
              <IconButton
                iconProps={{
                  iconName:
                    isAboutShowed === false ? "ChevronDown" : "ChevronUp",
                }}
                title="Show"
                className={`${classes.whiteFont} ${classes.expandMarginLeft}`}
                onClick={showAboutBingWallpaper}
              />
            </Col>
          </Row>
          {isAboutShowed && (
            <>
              <Separator />
              <div className={classes.whiteFont}>
                Bing Wallpaper : Version (1.0.0)
                <br />
                Developed by Sourav Bhattacharya
              </div>
            </>
          )}
        </div>
      </Container>
    );
}

export default App;