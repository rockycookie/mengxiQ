import Queue from "./Queue";

function Body(
  props: {qid: string}
) {
return (
  <div>
    <Queue qid={props.qid}/>
  </div>
);
}

export default Body;
