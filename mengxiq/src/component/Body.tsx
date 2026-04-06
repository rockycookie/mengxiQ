import Queue from './Queue';

function Body(
  props: { qid: string, queueReloadTrigger: number }
) {
  return (
    <div>
      <Queue qid={props.qid} queueReloadTrigger={props.queueReloadTrigger} />
    </div>
  );
}

export default Body;
