import { learnWord } from "./learnWord";
import { learnMath } from "./learnMath";

export const functions = [learnWord, learnMath];

export const functionMap = {
    [learnWord.name]: learnWord,
    [learnMath.name]: learnMath,
};
