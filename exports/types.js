//
// The entities the checker concerns, as types the editor can check -- GLOSSARY.md's
// Candidate, Tier, Finding and Assessment -- and the shape of one entry in a
// validator's JSON report, as json-schema-dev's CONTRACT.md states it.
//
//   /** @typedef {import('./types.js').Finding} Finding */

// @ts-check

module.exports = {}

/**
 * @typedef {object} Tier
 * @property {string}   id            names the tier wherever one is chosen: a target, a manifest entry
 * @property {number}   number        its place in the order, from 1, for display
 * @property {string}   description   the commitment a candidate claiming the tier makes
 * @property {boolean}  [blocksHigherTiers]  whether no tier above it is assessed while it is not met
 * @property {string[]} expectations  the names of the expectations it holds
 */
/**
 * @typedef {object} Expectation  a condition a candidate is expected to satisfy
 * @property {string} name
 * @property {'json-schema'|'parse'} instrument  what checks it: the JSON Schema validators, or check-tro's own parse
 * @property {string} definitionPath  the file that defines it: a schema, or for a parse check its summary and description
 * @property {Tier}   tier         the tier it belongs to
 * @property {string} summary      what it checks, in a few words
 * @property {string} description  what it checks, in one sentence
 * @property {string[]} requires   the expectations in its tier or a lower one that must be met before it is checked
 * @property {string[]} validatorFlags  options passed to each validator with its schema, such as --reject-duplicate-members
 */
/**
 * @typedef {object} Candidate
 * @property {string}                         [name]      the manifest's name for it, where it came from one
 * @property {string}                         fileName
 * @property {string}                         path
 * @property {string}                         [description]
 * @property {Tier}                           targetTier
 * @property {'default'|'manifest'|'option'}  targetSource  where the target came from
 */
/**
 * @typedef {object} Assessment  whether a candidate meets the expectations in a tier
 * @property {Tier}          tier     the tier assessed
 * @property {'met'|'unmet'} outcome  met only when every expectation in it and in every lower tier is met
 */
/**
 * @typedef {object} Finding  what checking one expectation against a candidate established
 * @property {Expectation}                                 expectation
 * @property {'met'|'unmet'|'not assessed'|'not claimed'}  outcome  not assessed when a lower tier that blocks higher tiers, or a required expectation, is not met
 * @property {Diagnostic[]}                                errors   empty unless unmet
 */
/**
 * @typedef {object} ValidatorReport  what one validator wrote when asked for its JSON report
 * @property {boolean}      valid
 * @property {Diagnostic[]} errors   empty when valid
 */
/**
 * @typedef {object} Diagnostic  one entry of a validator's JSON report, as CONTRACT.md shapes it
 * @property {(string|number)[]}     [site]         where in the candidate; absent for the document itself
 * @property {string}                [keyword]      the keyword that failed; absent for a boolean schema
 * @property {(string|number)[]}     clause         where that keyword lives in the schema
 * @property {string}                [document]     which schema file, where not the expectation's own
 * @property {Object<string, *>}     [constraint]   what the keyword demanded
 * @property {Object<string, *>}     [particulars]  what specifically went wrong
 * @property {*}                     [found]        the value at site
 * @property {string}                [message]      the expectation's own words, where it has them
 * @property {Attempt[]}             [rejections]   the attempts, for a keyword that offered alternatives
 */
/**
 * @typedef {object} Attempt  one way a check could have been passed that a validator tried and that did not work
 * @property {(string|number)[]} [clause]  the branch, for anyOf and oneOf
 * @property {(string|number)[]} [site]    the element, for contains
 * @property {Diagnostic[]}      errors    why it did not work
 */
