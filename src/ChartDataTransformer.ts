import {JiraFieldInfo, TransformFunction} from "./common/Types.ts";
import {transformDataToSeriesStatus} from "./charts/StatusSeriesChart.ts";
import {SeriesOption} from "echarts";
import {transformDataToSeriesUser} from "./charts/UserSeriesChart.ts";
import {transformDataToSeriesChecklist} from "./charts/ChecklistSeriesChart.ts";

export function transformDataToSeriesKnownTypes(): string[] {
    return Object.keys(transformDataToSeriesMethodMap);
}

const transformDataToSeriesMethodMap: { [combinedType: string]: TransformFunction } =
    {
        "status:status": transformDataToSeriesStatus,
        "user:com.atlassian.jira.plugin.system.customfieldtypes:userpicker": transformDataToSeriesUser,
        "user:assignee": transformDataToSeriesUser,
        "user:com.candylio.jira.plugins.jira-csat:jira.csat.assignee": transformDataToSeriesUser,
        "user:com.candylio.jira.plugins.jira-csat:jira.csat.recipient": transformDataToSeriesUser,
        "array:com.okapya.jira.checklist:checklist:checklist-item": transformDataToSeriesChecklist
    }


export function transformDataToSeries(field: JiraFieldInfo, category: string[], maxTime: number, createdTime: number): SeriesOption[] {
    return transformDataToSeriesMethodMap[field.combinedType](field, category, maxTime, createdTime);
}