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
const DIM_STATUS = 3;
const DIM_STATUS_COLOR = 4;

const HEIGHT_RATIO = 0.6;

const renderStatus =
    (params: CustomSeriesRenderItemParams, api: CustomSeriesRenderItemAPI): CustomSeriesRenderItemReturn => {
        const categoryIndex = api.value(DIM_CATEGORY);
        const statusColor: string = api.value(DIM_STATUS_COLOR) as string;
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
                    fill: statusColor
                }
            }
        );
    };

const dtFormatOpts: LocaleOptions = {locale: userLocale};
const dtFormatStyle: DateTimeFormatOptions = {dateStyle: "short", timeStyle: "short", timeZone: userTZ};

export function transformDataToSeriesStatus(field: JiraFieldInfo, category: string[], maxTime: number, createdTime: number): SeriesOption[] {

    const data: any[][] = [];

    let colorIndex = 0;
    const statusColorMap: { [status: string]: string } = {};

    const categoryIndex = category.push("Status") - 1;

    function getStatusColor(status: string): string {
        let color = statusColorMap[status];
        if (color === undefined) {
            color = ColorPalette[colorIndex];
            statusColorMap[status] = color;
            colorIndex++;
            if (colorIndex >= ColorPalette.length) {
                colorIndex = 0;
            }
        }
        return color;
    }

    if (field.history.length > 0) {
        const oldStatus = field.history[0].item.fromString;
        if (oldStatus) {
            data.push([
                    createdTime,
                    field.history[0].time,
                    categoryIndex,
                    oldStatus,
                    getStatusColor(oldStatus)
                ]
            )
        }
        for (let i = 0; i < field.history.length - 1; i++) {
            const status = field.history[i].item.toString || "unknown";
            data.push([
                    field.history[i].time,
                    field.history[i + 1].time,
                    categoryIndex,
                    status,
                    getStatusColor(status)
                ]
            )
        }
        const i = field.history.length - 1;
        const status = field.history[i].item.toString || "unknown";
        data.push([
                field.history[i].time,
                Math.min(maxTime, new Date().valueOf()),
                categoryIndex,
                "status",
                getStatusColor(status)
            ]
        )
    }

    return [{
        type: 'custom',
        name: field.name,
        data: data,
        renderItem: renderStatus,
        encode: {
            x: [DIM_START_TIME, DIM_END_TIME],
            y: DIM_CATEGORY,
            tooltip: [DIM_STATUS, DIM_START_TIME, DIM_END_TIME]
        },
        tooltip: {
            formatter: (params) => {
                // @ts-ignore
                const status = params.data?.[DIM_STATUS];
                // @ts-ignore
                const start = DateTime.fromMillis(params.data?.[DIM_START_TIME] || 0);
                // @ts-ignore
                const end = DateTime.fromMillis(params.data?.[DIM_END_TIME] || 0);

                const startStr = start.toLocaleString(dtFormatStyle, dtFormatOpts)
                const endStr = end.toLocaleString(dtFormatStyle, dtFormatOpts)
                const diff = end.diff(start, ["days", "hours", "minutes"]).toObject();
                const diffStr = ((diff.days) ? diff.days + " дн " : "") + ((diff.hours) ? diff.hours + " ч " : "") + ((diff.minutes) ? diff.minutes.toFixed(0) + " м" : "");

                return `${status}:<br>${startStr} - ${endStr}<br>${diffStr}`;
            }
        }
    }];
}
