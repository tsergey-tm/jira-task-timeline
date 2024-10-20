import React, {FC, useEffect, useState} from "react";
import {JiraFields, JiraFieldSchema, JiraIssueInfo} from "./common/JiraTypes.ts";
import "./MainScreen.css"
import {JiraFieldInfo, JiraFieldsInfo} from "./common/Types.ts";
import {MainChart} from "./MainChart.tsx";
import {transformDataToSeriesKnownTypes} from "./ChartDataTransformer.ts";

export const MainScreen: FC<{ baseUrl: string, issueKey: string }> =
    ({baseUrl, issueKey}) => {


        let [fields, setFields] = useState<JiraFieldsInfo>({});
        let [issue, setIssue] = useState<JiraIssueInfo | undefined>();
        let [lastActionTime, setLastActionTime] = useState<number>(0);
        let [createdTime, setCreatedTime] = useState<number>(0);

        function getInitialSelectedFields() {
            const tmp = localStorage.getItem('jira.tsergey.task.timeline');

            if (tmp !== null) {
                return JSON.parse(tmp);
            }

            return ["status"];
        }

        let [selectedFields, setSelectedFieldsOrig] = useState<string[]>(getInitialSelectedFields())

        function setSelectedFields(value: string[]) {
            localStorage.setItem('jira.tsergey.task.timeline', JSON.stringify(value));

            setSelectedFieldsOrig(value);
        }


        function setMaxLastActionTime(time: number) {
            setLastActionTime(Math.max(lastActionTime, time));
        }

        function findField(field: string, jiraFieldsData: JiraFields): JiraFieldInfo {

            const ff = jiraFieldsData.find(f => f.name === field || f.id === field || f.clauseNames.includes(field));
            if (ff !== undefined) {
                const combinedType = makeCombinedType(ff.schema);
                if (transformDataToSeriesKnownTypes().includes(combinedType)) {
                    return {
                        name: ff.name,
                        type: ff.schema?.type || "",
                        items: ff.schema?.items || "",
                        custom: ff.schema?.custom || "",
                        system: ff.schema?.system || "",
                        combinedType: makeCombinedType(ff.schema),
                        history: []
                    }
                }
            }
            return {
                name: "",
                type: "",
                items: "",
                custom: "",
                system: "",
                combinedType: "",
                history: []
            };
        }

        function replayHistory(
            issueData: JiraIssueInfo,
            usedJiraFieldsInfo: JiraFieldsInfo,
            jiraFieldsData: JiraFields) {

            setCreatedTime(Date.parse(issueData.fields.created).valueOf());

            issueData.changelog.histories.forEach(h => {
                const time = Date.parse(h.created).valueOf();
                setMaxLastActionTime(time);
                h.items.forEach(item => {
                    if (usedJiraFieldsInfo[item.field] === undefined) {
                        usedJiraFieldsInfo[item.field] = findField(item.field, jiraFieldsData);
                    }

                    if (usedJiraFieldsInfo[item.field].name !== "") {
                        usedJiraFieldsInfo[item.field].history.push({
                            time,
                            author: h.author,
                            item: item
                        });
                    }
                })
            })
        }

        function makeCombinedType(schema: JiraFieldSchema | null | undefined) {
            if (schema === undefined || schema === null) {
                return "";
            }
            if (schema.system) {
                if (schema.items) {
                    return schema.type + ":" + schema.system + ":" + schema.items;
                } else {
                    return schema.type + ":" + schema.system;
                }
            } else {
                if (schema.items) {
                    return schema.type + ":" + schema.custom + ":" + schema.items;
                } else {
                    return schema.type + ":" + schema.custom;
                }
            }
        }

        async function loadData() {

            const jiraFieldsUrl = baseUrl + "/rest/api/2/field";
            let jiraFieldsFetch = fetch(jiraFieldsUrl).then(res => res.ok ? res.json() : undefined);

            const jiraIssueUrl = baseUrl + "/rest/api/2/issue/" + issueKey;
            let jiraIssueFetch = fetch(jiraIssueUrl).then(res => res.ok ? res.json() : undefined);

            const [jiraFieldsData, jiraIssueData] =
                await Promise.all([jiraFieldsFetch, jiraIssueFetch]);

            const tempUsedJiraFieldsInfo: JiraFieldsInfo = {};

            replayHistory(jiraIssueData as JiraIssueInfo, tempUsedJiraFieldsInfo, jiraFieldsData as JiraFields)

            const usedJiraFieldsInfo: JiraFieldsInfo = {};

            Object.keys(tempUsedJiraFieldsInfo)
                .filter(field => tempUsedJiraFieldsInfo[field].name !== "")
                .forEach(field => usedJiraFieldsInfo[field] = tempUsedJiraFieldsInfo[field]);

            setFields(usedJiraFieldsInfo);
            setIssue(jiraIssueData as JiraIssueInfo);
        }

        useEffect(() => {
            loadData().then();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        function changeSelectedField(field: string, checked: boolean) {
            const tmp = [...selectedFields];
            if (checked) {
                tmp.push(field);
            } else {
                tmp.splice(tmp.indexOf(field), 1);
            }
            setSelectedFields(tmp);
        }

        return <div className="MainScreen" key="MainScreen">
            <div className="MainScreenFieldSelector" key="MainScreenFieldSelector">Поля:
                {Object.keys(fields).sort().map((field, index) =>
                    <React.Fragment key={"field_group_" + index}>
                        <input type="checkbox"
                               key={"field_cb_" + index}
                               id={field}
                               value={field}
                               checked={selectedFields.includes(field)}
                               disabled={field === "status"}
                               onChange={e => changeSelectedField(field, e.target.checked)}
                        />&nbsp;<label htmlFor={field}
                                       key={"field_label_" + index}>{fields[field].name}</label>&nbsp;&nbsp;
                    </React.Fragment>)}
            </div>
            <MainChart fields={fields} issue={issue} selectedFields={selectedFields} lastActionTime={lastActionTime}
                       createdTime={createdTime}
                       key="MainChart"/>
        </div>;
    };
