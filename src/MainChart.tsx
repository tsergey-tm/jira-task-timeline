import "./MainChart.css"
import React, {FC} from "react";
import {JiraIssueInfo} from "./common/JiraTypes.ts";
import {JiraFieldsInfo} from "./common/Types.ts";
import ReactEChartsCore from 'echarts-for-react/lib/core';
import {EChartsOption, SeriesOption} from "echarts";
import {
    DataZoomComponent,
    GridComponent,
    MarkLineComponent,
    TitleComponent,
    ToolboxComponent,
    TooltipComponent
} from "echarts/components";
import {BarChart, CustomChart, LineChart} from "echarts/charts";
import {CanvasRenderer} from "echarts/renderers";
import * as echarts from 'echarts/core';
import {transformDataToSeries} from "./ChartDataTransformer.ts";
import {userLocale} from "./common/Constants.ts";
import {DateTime} from "luxon";

// Register the required components
echarts.use(
    [TitleComponent, TooltipComponent, GridComponent, BarChart, CanvasRenderer, LineChart, CustomChart,
        ToolboxComponent, MarkLineComponent, DataZoomComponent]
);

export const MainChart: FC<{
    fields: JiraFieldsInfo,
    issue: JiraIssueInfo | undefined,
    selectedFields: string[],
    lastActionTime: number,
    createdTime: number
}> =
    ({fields, issue, selectedFields, lastActionTime, createdTime}) => {

        const maxTime = lastActionTime + 24 * 60 * 60 * 1000;

        const sf = [...selectedFields];

        if (sf.includes("status")) {
            // Make status as first chart
            sf.splice(sf.indexOf("status"), 1);
            sf.unshift("status");
        }

        const category: string[] = [];

        const series: SeriesOption[] = sf.map(field => fields[field])
            .filter(v => v !== undefined && v !== null)
            .flatMap(field => transformDataToSeries(field, category, maxTime, createdTime))


        function makeOptions(): EChartsOption {
            return {
                animation: true,
                title: {
                    text: (issue?.key) ? issue?.key + ": " + (issue?.fields?.summary) : "Issue loading",
                    left: 'center'
                },
                dataZoom: [
                    {
                        type: 'slider',
                        xAxisIndex: 0,
                        filterMode: 'weakFilter',
                        height: 20,
                        bottom: 0,
                        handleIcon:
                            'path://M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
                        handleSize: '80%',
                        showDetail: false
                    },
                    {
                        type: 'inside',
                        id: 'insideX',
                        xAxisIndex: 0,
                        filterMode: 'weakFilter',
                        zoomOnMouseWheel: false,
                        moveOnMouseMove: true
                    },
                    {
                        type: 'slider',
                        yAxisIndex: 0,
                        filterMode: 'weakFilter',
                        width: 10,
                        right: 10,
                        top: 70,
                        bottom: 20,
                        handleIcon:
                            'path://M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
                        handleSize: '80%',
                        showDetail: false
                    },
                    {
                        type: 'inside',
                        id: 'insideY',
                        yAxisIndex: 0,
                        filterMode: 'weakFilter',
                        zoomOnMouseWheel: false,
                        moveOnMouseMove: true,
                        moveOnMouseWheel: true
                    }
                ],

                toolbox: {
                    show: true,
                    feature: {
                        saveAsImage: {
                            show: true,
                        },
                        dataZoom: {
                            show: true
                        },
                    }
                },
                tooltip: {
                    axisPointer: {
                        show: true,
                    },
                },
                xAxis: {
                    type: 'time',
                    axisLabel: {
                        formatter: function (value) {
                            if (value) {
                                return DateTime.fromMillis(value).setLocale(userLocale).toLocaleString(DateTime.DATETIME_SHORT);
                            } else {
                                return "";
                            }
                        },
                    },
                },
                yAxis: {
                    type: 'category',
                    data: category,
                    inverse: true,
                },
                series: series
            };
        }

        return <div className="MainChartContainer">
            <ReactEChartsCore option={makeOptions()} echarts={echarts} style={{
                height: '100%',
                width: '100%',
            }}/>
        </div>;

    }
