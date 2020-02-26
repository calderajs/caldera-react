import React, {
  ReactElement,
  useContext,
  useLayoutEffect,
  useRef
} from "react";
import deepEqual from "fast-deep-equal";
import { HeadElementID, MessageType } from "../rpc/messages";
import { CalderaContext } from "./CalderaContainer";

const HeadElement = ({
  type,
  props
}: {
  type: string;
  props: Record<string, any>;
}) => {
  const headElementId = useRef<HeadElementID>();
  const context = useContext(CalderaContext);

  const lastType = useRef<typeof type | undefined>();
  const lastProps = useRef<typeof props | undefined>();

  useLayoutEffect(() => {
    // Initial render
    const elementId = context.nextHeadElementId++ as HeadElementID;
    headElementId.current = elementId;
    lastType.current = type;
    lastProps.current = props;

    context.dispatch({
      msg: MessageType.APPEND_OR_UPDATE_HEAD,
      elementId,
      type,
      attrs: props
    });

    return () => {
      context.dispatch({
        msg: MessageType.DELETE_HEAD,
        elementId
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    // Subsequent updates
    if (
      headElementId.current !== undefined &&
      (type !== lastType.current || !deepEqual(props, lastProps.current))
    ) {
      lastType.current = type;
      lastProps.current = props;

      context.dispatch({
        msg: MessageType.APPEND_OR_UPDATE_HEAD,
        elementId: headElementId.current,
        type,
        attrs: props
      });
    }
  }, [context, props, type]);

  return null;
};

export const Head: React.FunctionComponent = ({ children }) => {
  const context = useContext(CalderaContext);

  useLayoutEffect(() => {
    context.requestFlush();
  });

  // Batch flush delete
  useLayoutEffect(() => {
    return () => context.requestFlush();
  }, [context]);

  return (
    <>
      {React.Children.map(children, child => {
        const elementChild = child as ReactElement;
        if (!(typeof elementChild.type === "string")) {
          throw new Error("Head children must have string types");
        }
        return (
          <HeadElement
            type={elementChild.type}
            props={elementChild.props}
            key={elementChild.key ?? undefined}
          />
        );
      })}
    </>
  );
};
