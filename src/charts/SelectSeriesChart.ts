import {JiraFieldInfo} from "../common/Types.ts";
import {
    CustomSeriesRenderItemAPI,
    CustomSeriesRenderItemParams,
    CustomSeriesRenderItemReturn
} from "echarts/types/dist/echarts";
import * as echarts from 'echarts/core';
import {ColorPalette} from "../common/Colors.ts";
import {SeriesOption} from "echarts";
import {DateTime, DateTimeFormatOptions, LocaleOptions} from "luxon";
import {userLocale, userTZ} from "../common/Constants.ts";

const DIM_START_TIME = 0;
const DIM_END_TIME = 1;
const DIM_CATEGORY = 2;
const DIM_OPTION = 3;
const DIM_OPTION_COLOR = 4;

const HEIGHT_RATIO = 0.6;

function renderOption(params: CustomSeriesRenderItemParams, api: CustomSeriesRenderItemAPI): CustomSeriesRenderItemReturn {
    const categoryIndex = api.value(DIM_CATEGORY);
    const optionColor: string = api.value(DIM_OPTION_COLOR) as string;
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
                fill: optionColor
            }
        }
    );
}

const dtFormatOpts: LocaleOptions = {locale: userLocale};
const dtFormatStyle: DateTimeFormatOptions = {dateStyle: "short", timeStyle: "short", timeZone: userTZ};

export function transformDataToSeriesSelect(field: JiraFieldInfo, category: string[], maxTime: number, createdTime: number): SeriesOption[] {

    const data: any[][] = [];

    let colorIndex = 0;
    const optionColorMap: { [option: string]: string } = {};

    const categoryIndex = category.push(field.name) - 1;

    function getOptionColor(option: string): string {
        let color = optionColorMap[option];
        if (color === undefined) {
            color = ColorPalette[colorIndex];
            optionColorMap[option] = color;
            colorIndex++;
            if (colorIndex >= ColorPalette.length) {
                colorIndex = 0;
            }
        }
        return color;
    }

    if (field.history.length > 0) {
        let oldOption = field.history[0].item.fromString;
        if (oldOption) {
            data.push([
                    createdTime,
                    field.history[0].time,
                    categoryIndex,
                    oldOption,
                    getOptionColor(oldOption)
                ]
            );
        }
        for (let i = 0; i < field.history.length - 1; i++) {
            const option = field.history[i].item.toString || "unknown";
            data.push([
                    field.history[i].time,
                    field.history[i + 1].time,
                    categoryIndex,
                    option,
                    getOptionColor(option)
                ]
            )
        }
        const i = field.history.length - 1;
        const option = field.history[i].item.toString || "unknown";
        data.push([
                field.history[i].time,
                Math.min(maxTime, new Date().valueOf()),
                categoryIndex,
                option,
                getOptionColor(option)
            ]
        )
    }

    return [{
        type: 'custom',
        name: field.name,
        data: data,
        renderItem: renderOption,
        encode: {
            x: [DIM_START_TIME, DIM_END_TIME],
            y: DIM_CATEGORY,
            tooltip: [DIM_OPTION, DIM_START_TIME, DIM_END_TIME]
        },
        tooltip: {
            formatter: (params) => {
                // @ts-ignore
                const option = params.data?.[DIM_OPTION];
                // @ts-ignore
                const start = DateTime.fromMillis(params.data?.[DIM_START_TIME] || 0);
                // @ts-ignore
                const end = DateTime.fromMillis(params.data?.[DIM_END_TIME] || 0);

                const startStr = start.toLocaleString(dtFormatStyle, dtFormatOpts)
                const endStr = end.toLocaleString(dtFormatStyle, dtFormatOpts)
                const diff = end.diff(start, ["days", "hours", "minutes"]).toObject();
                const diffStr = ((diff.days) ? diff.days + " дн " : "") + ((diff.hours) ? diff.hours + " ч " : "") + ((diff.minutes) ? diff.minutes.toFixed(0) + " м" : "");

                return `${option}:<br>${startStr} - ${endStr}<br>${diffStr}`;
            }
        }
    }];
}
