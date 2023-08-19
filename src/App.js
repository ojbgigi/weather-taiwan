import { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { ThemeProvider } from "@emotion/react";
import dayjs from "dayjs";

import { ReactComponent as AirFlowIcon } from "./images/airFlow.svg";
import { ReactComponent as DayCloudyIcon } from "./images/day-cloudy.svg";
import { ReactComponent as RainIcon } from "./images/rain.svg";
import { ReactComponent as RefreshIcon } from "./images/refresh.svg";
import { ReactComponent as LoadingIcon } from "./images/loading.svg";

// 定義深淺色主題配色
const theme = {
  light: {
    backgroundColor: "#ededed",
    foregroundColor: "#f9f9f9",
    boxShadow: "0 1px 3px 0 #999999",
    titleColor: "#212121",
    temperatureColor: "#757575",
    textColor: "#828282",
  },
  dark: {
    backgroundColor: "#1F2022",
    foregroundColor: "#121416",
    boxShadow:
      "0 1px 4px 0 rgba(12, 12, 13, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.15)",
    titleColor: "#f9f9fa",
    temperatureColor: "#dddddd",
    textColor: "#cccccc",
  },
};

const Container = styled.div`
  background-color: ${({ theme }) => theme.backgroundColor};
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const WeatherCard = styled.div`
  position: relative;
  min-width: 360px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  background-color: ${({ theme }) => theme.foregroundColor};
  box-sizing: border-box;
  padding: 30px 15px;
`;

const Location = styled.div`
  font-size: 28px;
  color: ${({ theme }) => theme.titleColor};
  margin-bottom: 20px;
`;

const Description = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.textColor};
  margin-bottom: 30px;
`;

const CurrentWeather = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Temperature = styled.div`
  color: ${({ theme }) => theme.temperatureColor};
  font-size: 96px;
  font-weight: 300;
  display: flex;
`;

const Celsius = styled.div`
  font-weight: normal;
  font-size: 42px;
`;

const AirFlow = styled.div`
  display: flex;
  align-items: center;
  font-size: 16x;
  font-weight: 300;
  color: ${({ theme }) => theme.textColor};
  margin-bottom: 20px;

  svg {
    width: 25px;
    height: auto;
    margin-right: 30px;
  }
`;

const Rain = styled.div`
  display: flex;
  align-items: center;
  font-size: 16x;
  font-weight: 300;
  color: ${({ theme }) => theme.textColor};

  svg {
    width: 25px;
    height: auto;
    margin-right: 30px;
  }
`;

const DayCloudy = styled(DayCloudyIcon)`
  flex-basis: 30%;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 24px;
  align-items: center;
`;

const Refresh = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.textColor};
  display: flex;

  @keyframes rotate {
    from {
      transform: rotate(360deg);
    }
    to {
      transform: rotate(0deg);
    }
  }

  svg {
    margin-left: 10px;
    width: 15px;
    height: 15px;
    cursor: pointer;
    animation: rotate infinite 1.5s linear;
    animation-duration: ${({ isLoading }) => (isLoading ? "1.5s" : "0s")};
  }
`;

const Theme = styled.div`
  font-size: 12px;
  background: ${({ theme }) => theme.backgroundColor};
  padding: 8px 16px;
  border-radius: 40px;
  color: ${({ theme }) => theme.titleColor};
  cursor: pointer;
`;

const AUTHORIZATION_KEY = "CWB-EB20F126-AF6D-46A6-AB61-63065FF3DA1C";
const LOCATION_NAME = "臺北市";

const fetchWeatherForecast = () => {
  return fetch(
    `https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${AUTHORIZATION_KEY}&locationName=${LOCATION_NAME}`
  )
    .then((response) => response.json())
    .then((data) => {
      const locationData = data.records.location[0];
      const weatherElements = locationData.weatherElement.reduce(
        (neededElements, item) => {
          if (["Wx", "PoP", "CI"].includes(item.elementName)) {
            neededElements[item.elementName] =
              item.time[0].parameter.parameterName;
          }
          return neededElements;
        },
        {}
      );

      //把取得的資料傳出去
      return {
        description: `${weatherElements.Wx}，感受${weatherElements.CI}`,
        rainPossibility: weatherElements.PoP,
      };
    });
};

const fetchCurrentWeather = () => {
  return fetch(
    `https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-089?Authorization=${AUTHORIZATION_KEY}&locationName=${LOCATION_NAME}&elementName=`
  )
    .then((response) => response.json())
    .then((data) => {
      //將風速氣溫資料取出
      const locationData = data.records.locations[0].location[0];
      const weatherElements = locationData.weatherElement.reduce(
        (neededElements, item) => {
          if (["T", "WS", "PoP6h", "Wx"].includes(item.elementName)) {
            neededElements[item.elementName] =
              item.time[0].elementValue[0].value;
          }
          return neededElements;
        },
        {}
      );
      //把取得的資料傳出去
      return {
        observationTime: locationData.weatherElement[1].time[0].startTime,
        windSpeed: weatherElements.WS,
        temperature: weatherElements.T,
        isLoading: false, //資料拉取完的狀態
      };
    });
};

const App = () => {
  const [currentTheme, setCurrentTheme] = useState("light");

  //定義會使用到的資料狀態
  const [weatherElement, setWeatherElement] = useState({
    observationTime: new Date(),
    locationName: "臺北市",
    description: "",
    windSpeed: 0,
    temperature: 0,
    rainPossibility: 0,
    isLoading: true,
  });

  const handleToggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
  };

  //把fetchData搬出useEffect
  const fetchData = async () => {
    //拉取資料前先把拉取資料狀態改成true
    setWeatherElement((prevState) => ({ ...prevState, isLoading: true }));

    const [currentWeather, weatherForecast] = await Promise.all([
      fetchCurrentWeather(),
      fetchWeatherForecast(),
    ]);

    //把取得的資料透過物件的解構賦值放入
    setWeatherElement((prevState) => ({
      ...prevState,
      ...currentWeather,
      ...weatherForecast,
      isLoading: false,
    }));
  };

  // 更新畫面
  useEffect(() => {
    console.log("execute function in useEffect");
    fetchData();
  }, []);

  //解構賦值取值更乾淨
  const {
    observationTime,
    locationName,
    description,
    windSpeed,
    temperature,
    rainPossibility,
    isLoading,
  } = weatherElement;

  return (
    <ThemeProvider theme={theme[currentTheme]}>
      <Container>
        <WeatherCard>
          <Location>{locationName}</Location>
          <Description>{description}</Description>
          <CurrentWeather>
            <Temperature>
              {Math.round(temperature)} <Celsius>°C</Celsius>
            </Temperature>
            <DayCloudy />
          </CurrentWeather>
          <AirFlow>
            <AirFlowIcon /> {windSpeed} m/h
          </AirFlow>
          <Rain>
            <RainIcon />
            {rainPossibility}%
          </Rain>
          <Footer>
            <Theme onClick={handleToggleTheme}>
              切換主題為{currentTheme === "light" ? "深色" : "淺色"}模式
            </Theme>
            <Refresh onClick={fetchData} isLoading={isLoading}>
              最後觀測時間：
              {new Intl.DateTimeFormat("zh-TW", {
                hour: "numeric",
                minute: "numeric",
              }).format(dayjs(observationTime))}
              {isLoading ? <LoadingIcon /> : <RefreshIcon />}
            </Refresh>
          </Footer>
        </WeatherCard>
      </Container>
    </ThemeProvider>
  );
};

export default App;
