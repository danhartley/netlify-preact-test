import { useState, useRef, useEffect } from "preact/hooks";
import { logic } from 'logic/logic';
import { useLocalStorageState } from 'api/state';
import { enums } from 'components/enums';
import { RankedList } from 'components/list/list';
import { MultipleChoice } from 'components/multiple-choice/multiple-choice';

import styles from 'components/question/question.module.scss';

export const Question = ({lesson}) => {

    lesson.questions = logic.shuffleArray(lesson.questions);

    if(!lesson.questions) return;

    const PLACEHOLDER = '---';
    const INITIAL_QUESTION = 0;

    const [question, setQuestion] = useState(lesson.questions[INITIAL_QUESTION]);
    const [list, setList] = useState(logic.getPlaceholders(question.listCount, PLACEHOLDER));
    const [testState, setTestState] = useState(enums.QUESTION_STATE.RUNNING);
    const [history, setHistory] = useLocalStorageState(null, enums.STORAGE_KEY.HISTORY);
    const [progress, setProgress] = useState({ number: 1, of: lesson.questions.length });

    const inputRef = useRef(null);
    const btnMarkRef = useRef(null);
    const btnNextRef = useRef(null);

    const resetInput = () => {
        if(inputRef.current) {
            inputRef.current.value = '';
            inputRef.current.focus();
        }
    };

    const addToList = e => {
        const entry = { name: e.target.value, state: enums.TRILEAN.UNKNOWN };
        if(entry.name === '') return;
        const updatedList = logic.updateList(question, list, entry, PLACEHOLDER);
        if(updatedList.filter(l => l.name !== PLACEHOLDER).length === question.listCount) {
            setTestState(enums.QUESTION_STATE.COMPLETED);
        }
        setList(updatedList);
    };

    const removeFromList = e => {
        const entry = e.target.innerText;
        setList([ ...list.filter(item => item.name !== entry), { name: PLACEHOLDER, state: enums.TRILEAN.UNKNOWN } ]);
        resetInput();
    };

    const checkAnswers = () => {
        const _score = logic.mark({ question, list });
        setList(_score.scores);
        setTestState(enums.QUESTION_STATE.MARKED);
        setHistory({..._score, lessonTitle: lesson.title}, enums.STORAGE_KEY.HISTORY);
    };

    const checkAnswer = question => {
        const _score = logic.mark({ question, list });
        setTestState(enums.QUESTION_STATE.MARKED);
        setHistory({..._score, lessonTitle: lesson.title}, enums.STORAGE_KEY.HISTORY);
    };

    const nextTest = e => {
        e.preventDefault();
        const index = logic.next(enums.DIRECTION.Next, lesson.questions.indexOf(question), lesson.questions.length);
        setQuestion(lesson.questions[index]);
        setTestState(enums.QUESTION_STATE.RUNNING);
        setProgress({ ...progress, number: progress.number + 1});
        setList(logic.getPlaceholders(lesson.questions[index].listCount, PLACEHOLDER));
    }; 

    useEffect(() => {
        window.addEventListener("keydown", e => {                 
            const target = e.target as HTMLButtonElement;
            if(target.type === 'submit') return;
            switch(e.code) {                
                case 'Enter':
                    const updatedList = logic.updateList(question, list, { name: inputRef.current.value, state: enums.TRILEAN.UNKNOWN }, PLACEHOLDER);
                    setList(updatedList);
                    break;
                default:
                    break;
            }
        });
    });

    const listItems = list.map(item => { 
        return <li 
                class={item.name !== PLACEHOLDER 
                    ? item.state === enums.TRILEAN.TRUE 
                        ? item.isOrdered === enums.TRILEAN.TRUE 
                            ? `${styles.correct} ${styles.correctOrder}`
                            : styles.correct
                        : item.state === enums.TRILEAN.FALSE 
                            ? styles.incorrect 
                            : '' 
                    : ''} 
                onClick={e => removeFromList(e)}
            >{item.name}</li> 
    });

    setTimeout(() => {
        resetInput();
        if(testState === enums.QUESTION_STATE.COMPLETED) btnMarkRef.current ? btnMarkRef.current.focus() : null;
        if(testState === enums.QUESTION_STATE.MARKED) btnNextRef.current ? btnNextRef.current.focus() : null;
    });

    let format;

    switch(question.type) {
        case enums.QUESTION_TYPE.ORDERED:
        case enums.QUESTION_TYPE.UNORDERED:
            format = 
                <>
                <input disabled={list.filter(l => l.name !== PLACEHOLDER).length === question.listCount} ref={inputRef} type="text" onBlur={e => addToList(e)} placeholder="" />
                <ul class={styles.answers}>{listItems}</ul>
                <button ref={btnMarkRef} onClick={() => checkAnswers()} disabled={testState !== enums.QUESTION_STATE.COMPLETED}>Check answers</button>
                </>;
            break;
        case enums.QUESTION_TYPE.MULTIPLE_CHOICE:
            format = <MultipleChoice question={question} type={enums.MULTIPLE_CHOICE_TYPE.RADIO_BUTTONS} checkAnswer={(question) => checkAnswer(question)} />;
            break;
    }

    return (
        <div class={styles.questions}>
            <section>
                <div><span>{question.text}</span><span class="super">{`${progress.number}/${progress.of}`}</span></div>                
                <>{format}</>                
                <button ref={btnNextRef} disabled={testState !== enums.QUESTION_STATE.MARKED} onClick={nextTest}>Next question</button>
            </section>
            <section>
                { (testState === enums.QUESTION_STATE.MARKED && question.type !== enums.QUESTION_TYPE.MULTIPLE_CHOICE) ? <RankedList items={question.items} unit={question.unit} /> : null }
            </section>
            <section class={styles.source}>
                <div><a href={lesson.source} target="_blank">Open source in a new tab</a></div>
                <div>Source: {lesson.provider}</div>
            </section>
        </div>
    )
};