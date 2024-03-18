import { v4 as uuidv4 } from 'uuid';
import {StableBTreeMap, ic, Vec, Opt} from 'azle';
import { checkUserId, checkPseudo, getUserU } from '../User/user.ts';

/**
 * Session is defined into User class structure that includes
 * - SessionPayload: out-contract data representing User
 * - sessionId: internal id to retrieve User from storage
 * - createdAt/updatedAt: Log data
 * Session must have unique value for next fields:
 * - id: Internal id for technical reason
 * ****
 * `sessionsStorage` it's a key-value datastructure that is used to store sessions.
 * {@Link StableBTreeMap} is a self-balancing tree that acts as
 *      a durable data storage that keeps data across canister upgrades.
 * We've chosen {@Link StableBTreeMap} as a storage for the next reasons:
 *   - `insert`, `get` and `remove` operations have a constant time complexity - O(1)
 *   - data stored in the map survives canister upgrades unlike using HashMap
 *          where data is stored in the heap and it's lost after the canister is upgraded
 *
 *  Brakedown of the `StableBTreeMap(string, Session)` datastructure:
 *  - the key value of map is a `sessionId`
 *  - the value in this map is a session itself `Session` that is related to a given key (`sessionId`)
 *
 *  Constructor values:
 *  1) 0 - memory id where to initialize a map.
 */

import {StableBTreeMap} from "azle";

/**
 * This type represents a session that can be listed on a board
 */

class Session {
    id:                     string;
    course:                 string;
    owner:                  string;
    place:                  string;
    date:                   Date;
    time:                   Number;
    length:                 Number;
    learnerCapacity:        Number;
    createdAt:              Date;
    updatedAt:              Date;
}

class SessionPayload {
    course:                 string;
    owner:                  string;
    place:                  string;
    date:                   Date;
    time:                   Number;
    length:                 Number;
    learnerCapacity:        Number;
}

const sessionsStorage = StableBTreeMap<string, Session>(0);

