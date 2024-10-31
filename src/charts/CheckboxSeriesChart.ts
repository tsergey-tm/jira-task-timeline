import {JiraFieldInfo} from "../common/Types.ts";
import {
    CustomSeriesRenderItemAPI,
    CustomSeriesRenderItemParams,
    CustomSeriesRenderItemReturn
} from "echarts/types/dist/echarts";
import * as echarts from 'echarts/core';
import {SeriesOption} from "echarts";
import {DateTime, DateTimeFormatOptions, LocaleOptions} from "luxon";
import {userLocale, userTZ} from "../common/Constants.ts";
import {CheckboxData, parseMultiCheckbox} from "./utils/MultiCheckboxParser.ts";

const DIM_START_TIME = 0;
const DIM_END_TIME = 1;
const DIM_CATEGORY = 2;
const DIM_VALUE = 3;
const DIM_VALUE_COLOR = 4;

const HEIGHT_RATIO = 0.6;

const renderCheckbox =
    (params: CustomSeriesRenderItemParams, api: CustomSeriesRenderItemAPI): CustomSeriesRenderItemReturn => {
        const categoryIndex = api.value(DIM_CATEGORY);
        const userColor: string = api.value(DIM_VALUE_COLOR) as string;
        const start = api.coord([api.value(DIM_START_TIME), categoryIndex]);
        const end = api.coord([api.value(DIM_END_TIME), categoryIndex]);
        const height = (api.size?.([0, 1]) as number[])[1] * HEIGHT_RATIO;
        const rectShape = echarts.graphic.clipRectByRect(
            {
                x: start[0],
                y: start[1] - height / 2,
                width: end[0] - start[0],
                height: height
            },
            {
                //@ts-ignore
                x: params.coordSys.x ?? 0,
                //@ts-ignore
                y: params.coordSys.y ?? 0,
                //@ts-ignore
                width: params.coordSys.width ?? 0,
                //@ts-ignore
                height: params.coordSys.height ?? 0
            }
        );
        return (
            rectShape && {
                type: 'rect',
                transition: ['shape'],
                shape: rectShape,
                style: {
                    fill: userColor,
                    stroke: 'grey',
                    lineWidth: 1
                }
            }
        );
    };

const dtFormatOpts: LocaleOptions = {locale: userLocale};
const dtFormatStyle: DateTimeFormatOptions = {dateStyle: "short", timeStyle: "short", timeZone: userTZ};

export function transformDataToSeriesCheckbox(field: JiraFieldInfo, category: string[], maxTime: number, createdTime: number): SeriesOption[] {

    const checkboxData: CheckboxData[] = parseMultiCheckbox(field, createdTime);

    return checkboxData.map(checkbox => {

        const data: any[][] = [];

        const categoryIndex = category.push(checkbox.category) - 1;

        for (let i = 0; i < checkbox.data.length - 1; i++) {
            if (!checkbox.data[i].removed) {
                data.push([
                        checkbox.data[i].time,
                        checkbox.data[i + 1].time,
                        categoryIndex,
                        checkbox.category,
                        '#91cc75'
                    ]
                );
            }
        }
        if (checkbox.data.length > 0) {
            const i = checkbox.data.length - 1;
            if (!checkbox.data[i].removed) {
                data.push([
                        checkbox.data[i].time,
                        Math.min(maxTime, new Date().valueOf()),
                        categoryIndex,
                        checkbox.category,
                        '#91cc75'
                    ]
                );
            }
        }

        return {
            type: 'custom',
            name: field.name,
            data: data,
            renderItem: renderCheckbox,
            encode: {
                x: [DIM_START_TIME, DIM_END_TIME],
                y: DIM_CATEGORY,
                tooltip: [DIM_VALUE, DIM_START_TIME, DIM_END_TIME]
            },
            tooltip: {
                formatter: (params) => {
                    // @ts-ignore
                    const user = params.data?.[DIM_VALUE];
                    // @ts-ignore
                    const start = DateTime.fromMillis(params.data?.[DIM_START_TIME] || 0);
                    // @ts-ignore
                    const end = DateTime.fromMillis(params.data?.[DIM_END_TIME] || 0);

                    const startStr = start.toLocaleString(dtFormatStyle, dtFormatOpts)
                    const endStr = end.toLocaleString(dtFormatStyle, dtFormatOpts)
                    const diff = end.diff(start, ["days", "hours", "minutes"]).toObject();
                    const diffStr = ((diff.days) ? diff.days + " дн " : "") + ((diff.hours) ? diff.hours + " ч " : "") + ((diff.minutes) ? diff.minutes.toFixed(0) + " м" : "");

                    return `${user}:<br>${startStr} - ${endStr}<br>${diffStr}`;
                }
            }
        }
    });
}
