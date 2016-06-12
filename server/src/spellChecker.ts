import * as Rx from 'rx';
import * as fs from 'fs';
import * as path from 'path';
import { match } from './util/text';
import { Trie, addWordToTrie } from './suggest';
import * as sug from './suggest';
import * as Text from './util/text';

export interface WordDictionary {
    [index: string]: boolean;
}

const minWordLength = 3;

export function loadWords(filename: string): Rx.Observable<string> {
    const reader = Rx.Observable.fromNodeCallback<string>(fs.readFile);

    return reader(filename, 'utf-8')
        .flatMap(text => Rx.Observable.from(match(/(.+)(\r?\n)?/g, text)))
        .map(regExpExecArray => regExpExecArray[1])
        .map(line => line.trim())
        .filter(line => line !== '');
}

export function loadWordLists(filenames: string[]): Rx.Observable<WordDictionary> {
    return Rx.Observable.fromArray(filenames)
        .flatMap(loadWords)
        .map(line => line.toLowerCase().trim())
        .flatMap(line => Rx.Observable.concat(
            // Add the line
            Rx.Observable.just(line),
            // Add the individual words in the line
            Text.extractWordsFromTextRx(line).map(({word}) => word).filter(word => word.length > minWordLength)
        ))
        .tap(word => { trie = addWordToTrie(trie, word); })
        .reduce((wordList, word): WordDictionary => {
            wordList[word] = true;
            return wordList;
        }, <WordDictionary>Object.create(null) );
}

export function isWordInDictionary(word: string): Rx.Promise<boolean> {
    return wordList.then(wordList => {
        const nWord = word.toLowerCase();
        return wordList[nWord] === true
            || userWords[nWord] === true;
    });
}

export function setUserWords(...wordSets: string[][]) {
    userWords = Object.create(null);
    wordSets.forEach(words => {
        words.forEach(word => {
            userWords[word.toLowerCase()] = true;
        });
    });
}

let trie: Trie = { c: [] };

let userWords: WordDictionary = Object.create(null);

const wordList: Rx.Promise<WordDictionary> =
    loadWordLists([
        path.join(__dirname, '..', '..', 'dictionaries', 'wordsEn.txt'),
        path.join(__dirname, '..', '..', 'dictionaries', 'typescript.txt'),
        path.join(__dirname, '..', '..', 'dictionaries', 'node.txt'),
        path.join(__dirname, '..', '..', 'dictionaries', 'softwareTerms.txt'),
        path.join(__dirname, '..', '..', 'dictionaries', 'html.txt'),
        path.join(__dirname, '..', '..', 'dictionaries', 'php.txt'),
        path.join(__dirname, '..', '..', 'dictionaries', 'companies.txt'),
    ])
    .toPromise();

export function suggest(word: string): string[] {
    const searchWord = word.toLowerCase();
    return sug.suggest(trie, searchWord).map(sr => sr.word);
}