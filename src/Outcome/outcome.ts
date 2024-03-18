import { v4 as uuidv4 } from 'uuid';
import { StableBTreeMap, Vec, Opt, ic } from 'azle';

/**
 * Outcome represents expected value of learning course that may be:
 * - new Skills
 * - improved skills
 * - certification
 * ****
 * Outcome is defined into Outcome class structure that includes
 * - outcomePayload: out-contract data representing Outcome
 * - outcomeId: internal id to retrieve outcome from storage
 * - createdAt/updatedAt: Log data
 * Outcome must have unique value for next fields:
 * - id: Internal id for technical reason
 * - title - Human readable id for customers
 * ****
 * `outcomesStorage` it's a key-value datastructure that is used to store outcomes.
 * {@Link StableBTreeMap} is a self-balancing tree that acts as
 *      a durable data storage that keeps data across canister upgrades.
 * We've chosen {@Link StableBTreeMap} as a storage for the next reasons:
 *   - `insert`, `get` and `remove` operations have a constant time complexity - O(1)
 *   - data stored in the map survives canister upgrades unlike using HashMap
 *          where data is stored in the heap and it's lost after the canister is upgraded
 *
 *  Brakedown of the `StableBTreeMap(string, Outcome)` datastructure:
 *  - the key value of map is an `outcomeId`
 *  - the value in this map is an outcome itself `Outcome` that is related to a given key (`outcomeId`)
 *
 *  Constructor values:
 *  1) 0 - memory id where to initialize a map.
 */

// Enum of outcomes types
enum OutcomeType {
    SKILL,
    CERTIFICATION,
    CERTIFIED_SKILL
}


/**
 * This type represents an outcome that can be listed on a board
 */
export class Outcome {
    id:             string;
    title:          string;
    type:           OutcomeType;
    createdAt:      Date;
    updatedAt:      Date | null;
}

class OutcomePayload {
    title:          string;
    type:           OutcomeType;
}

const outcomesStorage = StableBTreeMap<string, Outcome>(0);

// CRUD functions

/**
 * @name getOutcomes
 * @returns Vec<Outcome>
 */
function getOutcomes(): Vec<Outcome> {
    return outcomesStorage.values();
}

/**
 * @name getOutcome
 * @param id
 * @returns Outcome
 */
export function getOutcome(id: string): Opt<Outcome> {
    return outcomesStorage.get(id);
}

/**
 * @name addOutcome
 * @param payload
 * @returns Outcome
 */
export function addOutcome(payload: OutcomePayload): Outcome | string {
    if (!checkOutcomePayload(payload)) {
        return `Error: unexpected values in payload: \n ${payload}`;
    }
    if (isExistingOutcomeTitle(payload.title)) {
        return `Error: title '${payload.title}' already exists `;
    }
    const outcome: Outcome = {
        id:         uuidv4(),
        ...payload,
        createdAt:  getCurrentDate(),
        updatedAt:  null
    };
    outcomesStorage.insert(outcome.id, outcome);
    return outcome;
}

/**
 * @name updateOutcome
 * @param id
 * @param payload
 */

function updateOutcome(id: string, payload: OutcomePayload): Outcome | string {
    if (!chetOutcomeId(id)) {
        return `Error: no outcome found with id=${id}`;
    }
    if (!checkOutcomePayload(payload)) {
        return `Error: unexpected values in payload: \n ${payload}`;
    }
    const outcome = outcomesStorage.get(id).Some;
    if (isExistingOutcomeTitle(payload.title) && (outcome.title) != payload.title) {
        return  `Error: title '${payload.title}' already exists `;
    }
    const updatedOutcome: Outcome = {
        ...outcome,
        ...payload,
        updatedAt: getCurrentDate()
    };
    outcomesStorage.insert(id, updatedOutcome);
    return updatedOutcome;
}

/**
 * @name removeOutcome
 * @param id
 */

function removeOutcome(id: string): Opt<Outcome> | string {
    if (!chetOutcomeId(id)) {
        return `Error: no outcome found with id=${id}`;
    }
    return outcomesStorage.remove(id);
}

/**
 * @name checkOutcomePayload
 * @param payload
 * @returns boolean
 */
function checkOutcomePayload(payload: OutcomePayload): boolean {
    return (
        payload.title.trim().length > 0 &&
            payload.type != null
    );
}

/**
 * @name isExistingOutcomeTitle
 * @param title
 * @returns boolean
 */
export function isExistingOutcomeTitle(title: string): boolean {
    for (const outcome of outcomesStorage.values()) {
        if (outcome.title.trim() == title.trim()) {
            return true;
        }
    }
    return false;
}

/**
 * @name checkOutcomeId
 * @param outcomeId
 * @returns boolean
 */
export function chetOutcomeId(id: string): boolean {
    return outcomesStorage.containsKey(id);
}


// Utils internal functions
function getCurrentDate(): Date {
    const timestamp = new Number(ic.time());
    return new Date(timestamp.valueOf() / 1000_000);
}