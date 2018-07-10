'use strict';

const Twitter = require('twitter');
const fs = require('fs');

const STATUSES_FILTER_STREAM = 'statuses/filter';

const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/=]*)/gm;
const TAGS_REGEX = /\B#\w*[a-zA-Z]+\w*/gm;
const USER_CITE_REGEX = /(?<=^|(?<=[^a-zA-Z0-9-_\.]))@([A-Za-z]+[A-Za-z0-9-_]+)/gm;

/**
 * Twitter feed analyzer
 */
class TwitterAnalyzer {

    /**
     * Creates a new Twitter analyzer
     * 
     * @param {string} ConsumerKey 
     * @param {string} ConsumerSecret 
     * @param {string} AccessToken 
     * @param {string} AccessTokenSecret 
     */
    constructor (ConsumerKey, ConsumerSecret, AccessToken, AccessTokenSecret) {
        this.logHandler = null;
        this.hashtags = {};
        this.client = new Twitter({
            consumer_key: ConsumerKey,
            consumer_secret: ConsumerSecret,
            access_token_key: AccessToken,
            access_token_secret: AccessTokenSecret
        });
    }

    /**
     * Clear hashtag statistics
     */
    resetAnalysis() {
        this.hashtags = {};
    }

    /**
     * Generic error handlers for stream errors. Lets you define an error handler to catch errors
     * instead of blocking the stream.
     * @param {Function} logHandler(error: Exception) error handler.
     */
    setLogHandler(logHandler) {
        if(!(logHandler instanceof Function)) {
            throw "Invalid log handler.";
        }
        this.logHandler = logHandler;    
    }

    /**
     * Write hashtags statistics on csv file.
     * @param {string} path output file path
     * @param {string} separator fields separator (optional, default is ',')
     * @param {string} lineSeparator words separator (optional, default is '\n')
     * @param {string} encoding file encoding (utf-8 as default)
     * @returns {Promise} a promise that's resolved when the dictionary count file has been written.
     */
    writeCountsFile(path, separator = ',', lineSeparator = '\n', encoding = 'utf-8') {
        let outStr = Object.keys(this.hashtags).reduce((memo, k) => {
            if(this.hashtags[k].count > 0) {
                memo.push(this.hashtags[k]);
            }
            return memo;
        }, []).sort((t1, t2) => {
            return t1.count > t2.count ? -1 : (
                t2.count > t1.count ? 1 : 0
            );
        }).reduce((str, elem) => {
            str += `${elem.text}${separator}${elem.count}${lineSeparator}`;
            return str;
        }, `hashtag${separator}count${lineSeparator}`);
        
        return new Promise((resolve, reject) => {
            fs.writeFile(path, outStr, encoding, (err) => {
                if(!err) {
                    resolve();
                } else {
                    reject("An error occurred while writing hashtags analytics: " + err.message, err);
                }
            });
        });
    }

    /**
     * Listens to timeline by location stream.
     * @param {string} locationBBStr bounding boxes for location, in raw csv format
     * @param {Function} dataHandler(object) handles new tweets from the stream.
     * @param {Function} errorHandler(object) handles errors in the stream. Optional.
     * @return {Object} Twitter stream parser
     */
    timelineStreamByLocation(locationBBStr, dataHandler, errorHandler) {
        let stream = this.client.stream(
            STATUSES_FILTER_STREAM, 
            { locations: locationBBStr, delimited: false }
        );
        stream.on('data', dataHandler);
        errorHandler && stream.on('error', errorHandler);
        return stream;
    }

    /**
     * Whatches the statuses stream by location and gathers analysis.
     * @param {string} locationBBStr bounding boxes for location, in raw csv format
     * @param {Function} dataHandler(tweet: object, hashtags: string[], tokens: string[]) optional 
     * @param {DictionaryAnalysis} dict a dictionary analysis facility
     * callback to handle new tweets for additional computations.
     * @return {Object} Twitter stream parser
     */
    watchStreamByLocation(locationBBStr, dataHandler, dictionary) {
        return this.timelineStreamByLocation(locationBBStr, 
            (tweet) => {
                let tweetTextWithoutSpecials = tweet.extended_tweet ? tweet.extended_tweet.full_text : tweet.text
                    .replace(URL_REGEX, "")
                    .replace(TAGS_REGEX, "")
                    .replace(USER_CITE_REGEX, "")
                ;
                let tkRes = dictionary && dictionary.tokenizeAndCount(tweetTextWithoutSpecials);
                let hashtags = (tweet.extended_tweet ? tweet.extended_tweet.entities : tweet.entities).hashtags.reduce((hs, hash) => {
                    hs.push(hash.text);
                    let hashtextLow = hash.text.toLowerCase();
                    if("undefined" === typeof this.hashtags[hashtextLow]) {
                        this.hashtags[hashtextLow] = { text: hash.text, count: 1 };
                    } else {
                        ++this.hashtags[hashtextLow].count;
                    }
                    return hs;
                }, []);
                dataHandler && dataHandler(tweet, hashtags, tkRes);
            },
            (err) => {
                if(this.errorLogHandler) {
                    this.errorLogHandler(err);
                } else {
                    throw err;
                }
            }
        );
    }

}

module.exports = TwitterAnalyzer;