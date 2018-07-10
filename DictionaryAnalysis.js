const fs = require('fs');

/**
 * Dictionary analysis facility.
 */
class DictionaryAnalysis {

    /**
     * Create a new Dictionary analysis facility
     */
    constructor() {
        this.terms = {};
        this.stopwords = [];
    }

    /**
     * Loads dictionary from file.
     * 
     * @param {string} path path to dictionary file
     * @param {string} separator words separator
     * @param {string} encoding file encoding (utf-8 as default)
     * @returns {Promise} a promise that's resolved when the dictionary has been read.
     */
    loadStopwordsFromFile(path, separator = '\n', encoding = 'utf-8') {
        return new Promise((resolve, reject) => {
            let contents = fs.readFile(
                path, 
                { 'encoding': encoding, 'flag': 'r' },
                (err, data) => {
                    if(err) {
                        reject("Cannot read stopwords file: " + err.message, err);
                    } else if("string" === typeof data && data.length > 0) {
                        let swDict = data.split(separator).reduce((dict, sw) => {
                            dict[sw] = true;
                            return dict;
                        }, {});
                        this.stopwords = Object.keys(swDict);
                        resolve();
                    } else {
                        reject("Empty stopwords file.");
                    }
                }
            );
        });
    }

    /**
     * Loads dictionary from file.
     * 
     * @param {string} path path to dictionary file
     * @param {string} separator words separator
     * @param {string} encoding file encoding (utf-8 as default)
     * @returns {Promise} a promise that's resolved when the dictionary has been read.
     */
    loadFromFile(path, separator = '\n', encoding = 'utf-8') {
        return new Promise((resolve, reject) => {
            let contents = fs.readFile(
                path, 
                { 'encoding': encoding, 'flag': 'r' },
                (err, data) => {
                    if(err) {
                        reject("Cannot read dictionary file: " + err.message, err);
                    } else if("string" === typeof data && data.length > 0) {
                        let words = data.split(separator);
                        words.forEach(w => {
                            this.terms[w] = 0;
                        });
                        resolve();
                    } else {
                        reject("Empty dictionary file.");
                    }
                }
            );
        });
    }

    /**
     * Write terms statistics on csv file.
     * @param {string} path output file path
     * @param {string} separator fields separator (optional, default is ',')
     * @param {string} lineSeparator words separator (optional, default is '\n')
     * @param {string} encoding file encoding (utf-8 as default)
     * @returns {Promise} a promise that's resolved when the dictionary count file has been written.
     */
    writeCountsFile(path, separator = ',', lineSeparator = '\n', encoding = 'utf-8') {
        let outStr = Object.keys(this.terms).reduce((memo, k) => {
            if(this.terms[k] > 0) {
                memo.push({term: k, count: this.terms[k]});
            }
            return memo;
        }, []).sort((t1, t2) => {
            return t1.count > t2.count ? -1 : (
                t2.count > t1.count ? 1 : 0
            );
        }).reduce((str, elem) => {
            str += `${elem.term}${separator}${elem.count}${lineSeparator}`;
            return str;
        }, `term${separator}count${lineSeparator}`);
        
        return new Promise((resolve, reject) => {
            fs.writeFile(path, outStr, encoding, (err) => {
                if(!err) {
                    resolve();
                } else {
                    reject("An error occurred while writing word counts: " + err.message, err);
                }
            });
        });
    }

    /**
     * Tokenizes and analyzes a phrase.
     * 
     * @param {string} str the string to tokenize
     * @param {RegExp} separator the separator RegExp
     * @param {Function} tokenTransformer(string): string tokenTransformer callback function that transforms tokens 
     * before analyzing them.
     * @return {object<string, Number>} a dictionary that maps words to overall word counts for 
     * this phrase.
     */
    tokenizeAndCount(str, separator = /[\W]/, tokenTransformer = (tk) => { return tk.toLowerCase() }) {
        let tokens = str.split(separator)
          , tokenCounts = {}
        ;
        tokens.forEach(tkRaw => {
            let tk = tokenTransformer(tkRaw);
            if(tk && !this.stopwords.includes(tk) && "undefined" !== typeof this.terms[tk]) {
                ++this.terms[tk];
                tokenCounts[tk] = this.terms[tk];
            }
        });
        return tokenCounts;
    }

    /**
     * Resets stats for all the terms in the dictionary.
     */
    resetCounters() {
        Object.keys(this.terms).forEach((k) => {
            this.terms[k] = 0;
        });
    }

}

module.exports = DictionaryAnalysis;