import styles from './NonProfitSection.module.css';

/**
 * Non-profit mission copy for the homepage — placed directly under
 * “Built for serious learners” in the features section.
 */
export default function NonProfitSection() {
  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h3 className={styles.title}>
            Built as a <strong>non-profit</strong> for the <strong>next generation</strong>
          </h3>
          <p className={styles.body}>
            Vestera is a non-profit organization built to help kids and teens around the world learn and practice
            investing and trading in one place. Our goal is to make sure everyone has access to the resources they
            need to start their investing journey. We aim to inspire and equip the next generation of investors and
            traders with the knowledge and confidence to succeed.
          </p>
        </div>
      </div>
    </div>
  );
}
