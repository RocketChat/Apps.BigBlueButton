import { IProcessor } from "@rocket.chat/apps-engine/definition/scheduler";
import { weeklyNotification } from "./weeklyNotification";

export const multipleProcessors : Array<IProcessor> = [
    {
        id: `meet0`,
        processor: weeklyNotification,
    },
    {
        id: `meet1`,
        processor: weeklyNotification,
    },
    {
        id: `meet2`,
        processor: weeklyNotification,
    },
    {
        id: `meet3`,
        processor: weeklyNotification,
    },
    {
        id: `meet4`,
        processor: weeklyNotification,
    },
    {
        id: `meet5`,
        processor: weeklyNotification,
    },
    {
        id: `meet6`,
        processor: weeklyNotification,
    },
]