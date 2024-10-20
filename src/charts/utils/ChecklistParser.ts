import {JiraIssueHistoryItem} from "../../common/JiraTypes.ts";
import {JiraFieldInfo} from "../../common/Types.ts";

export enum Action {
    Added,
    Checked,
    Unchecked,
    Removed,
    Modified
}

export interface ActionRecord {
    fromState: Action[];
    actions: Action[];
    from: string;
    to: string;
}

export interface ChecklistDataItems {
    time: number;
    value: string;
    checked: boolean;
    removed: boolean;
}

export interface ChecklistData {
    category: string;
    data: ChecklistDataItems[];
}

export function parseCheckList(field: JiraFieldInfo, createdTime: number): ChecklistData[] {

    const items: {
        name: string;
        history: ChecklistDataItems[];
    }[] = [];

    field.history.forEach(h => {
        const records = parseJiraChangeLogItem(h.item);

        records.forEach(record => {
            let item = items.find(
                i =>
                    i.name === (record.actions.includes(Action.Added) ? record.to : record.from)
            );

            if (record.actions.includes(Action.Added)) {
                if (item) {
                    item.history.push({
                        time: h.time,
                        value: record.to,
                        checked: record.actions.includes(Action.Checked),
                        removed: false
                    });
                } else {
                    items.push({
                        name: record.to,
                        history: [{
                            time: h.time,
                            value: record.to,
                            checked: record.actions.includes(Action.Checked),
                            removed: false
                        }]
                    });
                }
                return;
            }

            if (item === undefined) {
                item = {
                    name: record.from,
                    history: [{
                        time: createdTime,
                        value: record.from,
                        checked: record.fromState.includes(Action.Checked),
                        removed: false
                    }]
                }

                items.push(item);
            }

            let isChecked = item.history.slice(-1)[0].checked;
            if (record.fromState.includes(Action.Checked)) {
                if (!isChecked) {
                    // Need restore state
                    for (let j = 0; j < item.history.length; j++) {
                        item.history[j].checked = true;
                    }
                }
                isChecked = true;
            }

            if (record.actions.includes(Action.Removed)) {

                item.history.push({
                    time: h.time,
                    value: record.to,
                    checked: false,
                    removed: true
                });
                return;
            }

            if (record.actions.includes(Action.Checked)) {
                isChecked = true;
            } else if (record.actions.includes(Action.Unchecked)) {
                isChecked = false;
            }

            item.history.push({
                time: h.time,
                value: record.to,
                checked: isChecked,
                removed: false
            });
            item.name = record.to;
        });
    });

    return items.map<ChecklistData>(item => ({
        category: field.name + ": " + item.name,
        data: item.history
    }));
}

export function parseJiraChangeLogItem(changelogItem: JiraIssueHistoryItem): ActionRecord[] {

    const actionRE = /^(\d+)\) (?:\[([A-Za-z, ]{2,})] )?(?:(\[H]) )?(.*)/s

    const fromStrings = changelogItem.fromString?.split('\r\n') || [];
    const toStrings = changelogItem.toString?.split('\r\n') || [];

    if (toStrings.length === 1 && toStrings[0] === "All items removed") {
        while (toStrings.length < fromStrings.length) {
            toStrings.push("All items removed");
        }
    }

    const res: ActionRecord[] = [];

    for (let i = 0; i < toStrings.length; i++) {
        const t = toStrings[i];
        const f = fromStrings[i];

        const fMatch = f?.match(actionRE);
        const fStrNum = fMatch?.[1];
        const fStateStr = fMatch?.[2];
        const fHeader = fMatch?.[3];
        const fBody = fMatch?.[4];

        const fStateStrs: string[] = fStateStr?.split(", ") || [];
        const fStates: Action[] = [];
        if (fStateStrs.includes("Unchecked")) {
            fStates.push(Action.Unchecked);
        }
        if (fStateStrs.includes("Checked")) {
            fStates.push(Action.Checked);
        }

        if (t === "No changes but items were reordered") {
            continue;
        }

        if (t === "All items removed") {
            if (fHeader === "[H]") {
                continue;
            }

            res.push({actions: [Action.Removed], from: fBody!, to: "", fromState: fStates});
            continue;
        }

        const tMatch = t.match(actionRE);

        if (tMatch) {
            const [_, tStrNum, tActionStr, tHeader, tBody] = tMatch;
            const tActions = tActionStr?.split(", ") || [];

            if (tActions.includes("Added")) {
                if (tHeader === "[H]") {
                    continue;
                }

                const act = {actions: [Action.Added], from: "", to: tBody, fromState: fStates};
                if (tActions.includes("Checked")) {
                    act.actions.push(Action.Checked);
                }
                res.push(act);
                continue;
            }


            if (tStrNum !== fStrNum) {
                console.error(`Mismatch in line numbers: ${fStrNum} vs ${tStrNum}`);
                continue;
            }

            if (fHeader === "[H]" && tHeader === "[H]") {
                continue;
            }

            if (fHeader === "[H]") {
                if (tActions.includes("Removed")) {
                    continue;
                }
                const act = {actions: [Action.Added], from: "", to: tBody, fromState: fStates};
                if (tActions.includes("Checked")) {
                    act.actions.push(Action.Checked);
                }
                res.push(act);
                continue;
            }

            if (tHeader === "[H]") {
                res.push({actions: [Action.Removed], from: fBody!, to: "", fromState: fStates});
                continue;
            }

            if (tActions.includes("Removed")) {
                res.push({actions: [Action.Removed], from: fBody!, to: "", fromState: fStates});
                continue;
            }

            if (tActions.includes("Unchecked")) {
                const act = {actions: [Action.Unchecked], from: fBody!, to: tBody, fromState: fStates};
                if (act.from !== act.to) {
                    act.actions.push(Action.Modified);
                }
                res.push(act);
                continue;
            }

            if (tActions.includes("Checked")) {
                const act = {actions: [Action.Checked], from: fBody!, to: tBody, fromState: fStates};
                if (act.from !== act.to) {
                    act.actions.push(Action.Modified);
                }
                res.push(act);
                continue;
            }

            const act = {actions: [Action.Modified], from: fBody!, to: tBody, fromState: fStates};

            if (act.from === act.to) {
                continue;
            }

            res.push(act);
        }
    }

    return res;
}