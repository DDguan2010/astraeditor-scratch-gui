import React from 'react';
import styles from './spinner.css';

const Loading = () => (
    <div className={styles.container}>
        <div className={styles.logo}>
            <div className={styles.circle} id="circle_1"></div>
            <div className={styles.circle} id="circle_2"></div>
            <div className={styles.circle} id="circle_3"></div>
        </div>
    </div>
);

export default Loading;
