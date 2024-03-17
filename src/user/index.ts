import { v4 as uuidv4 } from 'uuid';
import { StableBTreeMap, Vec, Opt, ic } from 'azle';
import e from "express";

/**
 * User is defined into User class structure that includes
 * - UserPayload: out-contract data representing User
 * - userId: internal id to retrieve user from storage
 * - createdAt/updatedAt: Log data
 * User must have unique value for next fields:
 * - id: Internal id for technical reason
 * - pseudo: it's a needing to identify unique user out of contract scope
 * ****
 * `usersStorage` it's a key-value datastructure that is used to store users.
 * {@Link StableBTreeMap} is a self-balancing tree that acts as
 *      a durable data storage that keeps data across canister upgrades.
 * We've chosen {@Link StableBTreeMap} as a storage for the next reasons:
 *   - `insert`, `get` and `remove` operations have a constant time complexity - O(1)
 *   - data stored in the map survives canister upgrades unlike using HashMap
 *          where data is stored in the heap and it's lost after the canister is upgraded
 *
 *  Brakedown of the `StableBTreeMap(string, User)` datastructure:
 *  - the key value of map is an `userId`
 *  - the value in this map is an user itself `User` that is related to a given key (`userId`)
 *
 *  Constructor values:
 *  1) 0 - memory id where to initialize a map.
 */

/**
 * This type represents an user that can be listed on a board
 */
class User {
    id:                 string;
    name:               string;
    pseudo:             string;
    avatarURL:          string;
    createdAt:          Date;
    updatedAt:          Date | null;
}
class UserPayload {
    name:               string;
    pseudo:             string;
    avatarURL:          string;
}

const usersStorage = StableBTreeMap<string, User>(0);

// CRUD functions //
/**
 * @name getUsers
 * @description 'get all stored users'
 * @return Vec<User>
 */
export function getUsers(): Vec<User> {
    return usersStorage.values();
}

/**
 * @name getUser
 * @param string
 * @return Opt<User>
 * @description get user matching @userId
 */
export function getUser(userId: string): Opt<User> {
    return usersStorage.get(userId) || `no user found matching id=${userId}`;
}

/**
 * @name addUser
 * @param UserPayload
 * @return Opt<User>
 * @description 'create new User with payload content'
 */
function addUser(payload: UserPayload): User | string {
    if (!(checkPayload(payload))) return `Error: invalid payload : \n name=${payload.name} \n pseudo=${payload.pseudo}`;
    if (checkPseudo(payload.pseudo)) return `Error: can't create user cause ${payload.pseudo} already exists`;
    const user: User = {
        id: uuidv4(),
        ...payload,
        createdAt: getCurrentDate(),
        updatedAt: null
    };
    usersStorage.insert(user.id, user);
    return user;
}

/**
 * @name checkPseudo
 * @param string
 * @return boolean
 * @description 'check existence of still stored user with pseudo value'
 */
export function checkPseudo(pseudo: string): boolean {
    for (const user of usersStorage.values()) {
        if (user.pseudo.trim() === pseudo.trim()) {
            return true;
        }
    }
    return false;
}

/**
 * @name checkUserId
 * @param string
 * @return boolean
 * @description `check existence of userId from stored users`
 */
export function checkUserId(userId: string): boolean {
    return usersStorage.containsKey(userId);
}

/**
 * @name getIdFromPseudo
 * @param string
 * @return string
 * @description 'returns userId in case of matching user found'
 */
export function getIdFromPseudo(pseudo: string): string | null {
    for (const user of usersStorage.values()) {
        if (user.pseudo === pseudo) {
            return user.id;
        }
    }
    return null;
}

/**
 * @name checkPauload
 * @param UserPauload
 * @return boolean
 * @description `return validity of payload regarding specifications`
 */
function checkPayload(payload: UserPayload): boolean {
    return (payload.name.trim().length + payload.pseudo.trim().length > 2);
}

/**
 * @name updateUser
 * @param userId
 * @param payload
 * @return Opt<User>
 * @description `update user matching id with payload values`
 */
export function updateUser(userId: string, payload: UserPayload): User | string {
    if (!checkUserId(userId)) {
        return `Error: can't update user cause no user found matching id=${userId})`;
    }
    if (checkPseudo(payload.pseudo)) {
        return `Error: can't update user cause pseudo=${payload.pseudo} already exists`;
    }
    if (!checkPayload(payload)) {
        return `Error: can't update user cause unvalid payload=${payload}`;
    }
    const user: User = getUser(userId).Some;
    const updatedUser: User = {
        id: userId,
        ...user,
        ...payload,
        updatedAt: getCurrentDate(),
    };
    usersStorage.insert(userId, updatedUser);
    return updatedUser;
}

/**
 * @name removeUser
 * @param userId
 * @return User | string
 * @description `removes user matching userId from data storage`
 */
export function removeUser(userId: string): Opt<User> | string {
    if (!checkUserId(userId)) {
        return `can't remove user cause no user found matching id=${userId}`;
    }
    return usersStorage.remove(userId);
}


// Internal utils function
function getCurrentDate() {
    const timestamp = new Number(ic.time());
    return new Date(timestamp.valueOf() / 1000_000);
}