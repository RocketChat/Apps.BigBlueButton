import { IPersistence, IPersistenceRead } from "@rocket.chat/apps-engine/definition/accessors";
import { RocketChatAssociationModel, RocketChatAssociationRecord } from "@rocket.chat/apps-engine/definition/metadata";

export const persistSchedule = async (persistence: IPersistence, id: string, data: any): Promise<void> => {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, `${ id }#remind`);
    await persistence.updateByAssociation(association, data, true);
};

export const getSchedule = async (persistenceRead: IPersistenceRead, id: string): Promise<any> => {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, `${ id }#remind`);
    const result = await persistenceRead.readByAssociation(association) as Array<any>;
    return result && result.length ? result[0] : null;
};