import { v4 as uuidv4 } from 'uuid';
import { StableBTreeMap, Vec, Opt, ic } from 'azle';
import { checkUserId } from "../User/user";
import { chetOutcomeId} from "../Outcome/outcome";

/**
 * Course is defined into Course class structure that includes
 * - CoursePayload: out-contract data representing Course
 * - courseId: internal id to retrieve User from storage
 * - createdAt/updatedAt: Log data
 * Course must have unique value for next fields:
 * - id: Internal id for technical reason
 * - title - Human readable id for customers
 * ****
 * `coursesStorage` it's a key-value datastructure that is used to store courses.
 * {@Link StableBTreeMap} is a self-balancing tree that acts as
 *      a durable data storage that keeps data across canister upgrades.
 * We've chosen {@Link StableBTreeMap} as a storage for the next reasons:
 *   - `insert`, `get` and `remove` operations have a constant time complexity - O(1)
 *   - data stored in the map survives canister upgrades unlike using HashMap
 *          where data is stored in the heap and it's lost after the canister is upgraded
 *
 *  Brakedown of the `StableBTreeMap(string, Course)` datastructure:
 *  - the key value of map is an `courseId`
 *  - the value in this map is a course itself `Course` that is related to a given key (`courseId`)
 *
 *  Constructor values:
 *  1) 0 - memory id where to initialize a map.
 */

/**
 * This type represents a course that can be listed on a board
 */
export class Course {
    id:             string;
    title:          string;
    outcomes:       Vec<string>;
    creatorId:      string;
    createdAt:      Date;
    updatedAt:      Date | null;
}
class CoursePayload {
    title:          string;
    outcomes:       Vec<string>;
    creatorId:      string;
}

const coursesStorage = StableBTreeMap<string, Course>(0);

// CRUD functions

/**
 * @name getCourses
 * @returns Vec<Course>
 */
function getCourses(): Vec<Course> {
    return coursesStorage.values();
}

/**
 * @name getCourse
 * @param id
 * @return Opt<Course>
 */
export function getCourse(id: string): Opt<Course> {
    return coursesStorage.get(id);
}

/**
 * @name addCourse
 * @param payload
 * @return Course
 */
export function addCourse(payload: CoursePayload): Course | string {
    if (isExistingCourseTitle(payload.title)) {
        return `Error: course '${payload.title}' already exists`;
    }
    if (!checkCoursePayload(payload)) {
        return `Error: unexpected values in payload: \n ${payload}`;
    }
    const course: Course = {
        id:         uuidv4(),
        ...payload,
        createdAt:  getCurrentDate(),
        updatedAt:  null
    };
    coursesStorage.insert(course.id, course);
    return course;
}

/**
 * @name updateCourse
 * @param id
 * @param payload
 * @returns Course
 */
function updateCourse(id: string, payload: CoursePayload): Course | string  {
    if (checkCourseId(id)) {
        return `Error: no course with id=${id} found`;
    }
    if (!checkCourseId(id)) {
        return `Error: unexpected values in payload: \n ${payload}`;
    }
    const course = getCourse(id).Some;
    const updatedCourse: Course  = {
        ...course,
        ...payload,
        updatedAt: getCurrentDate()
    } ;
    coursesStorage.insert(id, updatedCourse);
    return updatedCourse;
}

/**
 * @name removeCourse
 * @param id
 */
function removeCourse(id: string): Course | string {
    if (!checkCourseId(id)) {
        return `Error: no course with id=${id} found`;
    }
    return coursesStorage.remove(id).Some || 'not found';
}

/**
 * @name checkCourseId
 * @param courseId
 * @returns boolean
 */
export function checkCourseId(courseId: string): boolean {
    return coursesStorage.containsKey(courseId);
}

/**
 * @name checkCoursePayload
 * @param payload
 * @returns boolean
 */
export function checkCoursePayload(payload: CoursePayload): boolean {
    if (
        payload.title.trim().length >= 0 &&
            checkUserId(payload.creatorId)
    ) {
        for (const outcomeId of payload.outcomes ) {
            if (!chetOutcomeId(outcomeId)) {
                return false;
            }
        }
        return true;
    }
    else {
        return false;
    }
}

/**
 * @name isExistingCourseTitle
 * @param title
 * @returns boolean
 */
export function isExistingCourseTitle(title: string): boolean {
    for (const course of coursesStorage.values()) {
        if (course.title.trim() === title.trim()) {
            return true;
        }
    }
    return false;
}

// utils internal functions
function getCurrentDate(): Date {
    const timestamp = new Number(ic.time());
    return new Date(timestamp.valueOf() / 1000_000);
}


