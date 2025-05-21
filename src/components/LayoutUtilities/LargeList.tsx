import React, {
    createContext,
    forwardRef,
    useRef,
    useContext,
    useEffect,
    useState,
} from "react";
import { VariableSizeList } from "react-window";

type RowGenerator<T> = ({
    ref,
    item,
}: {
    ref: React.ForwardedRef<HTMLElement>;
    item: T;
}) => React.ReactNode;

type ListContextData<T> = {
    items: T[];
    setRowHeight: (index: number, value: number) => void;
    rowHeights: { [index: number]: number };
    rowGenerator: RowGenerator<T>;
};

const ListContext: React.Context<ListContextData<unknown>> = createContext({
    items: [],
    setRowHeight: () => {},
    rowHeights: {},
    rowGenerator: () => <></>,
});

const Row = <T,>({
    index,
    style,
}: {
    index: number;
    style: React.CSSProperties;
}) => {
    const rowRef: React.Ref<HTMLDivElement> = useRef(null);
    const listContext: ListContextData<T> = useContext(
        ListContext
    ) as ListContextData<T>;
    // Update row heights with the current height of the row
    useEffect(() => {
        if (rowRef.current) {
            listContext.setRowHeight(index, rowRef.current.clientHeight);
        }
        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry && rowRef.current) {
                listContext.setRowHeight(index, rowRef.current.clientHeight);
            }
        });
        const currentElement = rowRef.current;
        if (currentElement) {
            resizeObserver.observe(currentElement);
        }
        return () => {
            if (currentElement) {
                resizeObserver.unobserve(currentElement);
            }
        };
    }, [rowRef.current]);

    return (
        <div style={style}>
            {listContext.rowGenerator({
                ref: rowRef,
                item: listContext.items[index],
            })}
        </div>
    );
};

const LargeList_List = forwardRef(
    (
        {
            width,
            height,
            defaultRowSize,
            listRef,
        }: {
            width: number;
            height: number;
            defaultRowSize: number;
            listRef: React.ForwardedRef<VariableSizeList>;
        },
        ref
    ) => {
        const listContext = useContext(ListContext);
        return (
            <VariableSizeList
                itemCount={listContext.items.length}
                itemSize={(index) =>
                    listContext.rowHeights[index] || defaultRowSize
                }
                height={height}
                width={width}
                ref={listRef}
                overscanCount={1}
                outerRef={ref}
            >
                {Row}
            </VariableSizeList>
        );
    }
);
LargeList_List.displayName = "LargeList_List";

const LargeList = <T,>({
    items,
    defaultRowSize,
    rowGenerator,
    style,
    ref,
}: {
    items: T[];
    defaultRowSize: number;
    style: React.CSSProperties;
    rowGenerator: RowGenerator<T>;
    ref?: React.ForwardedRef<HTMLElement>;
}) => {
    const containerRef: React.ForwardedRef<HTMLDivElement> = useRef(null);
    const [listDim, setListDim] = useState({ width: 0, height: 0 });
    const listRef: React.ForwardedRef<VariableSizeList> = useRef(null);
    const [rowHeights, setRowHeights] = useState({});
    const listUpdateDebounceTimer = useRef(0);

    // Monitor the container size of the list to pass the size to the Variable Size list
    useEffect(() => {
        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setListDim({
                    height: containerRef.current?.clientHeight ?? 0,
                    width: containerRef.current?.clientWidth ?? 0,
                });
            }
        });
        const currentElement = containerRef.current;
        if (currentElement) {
            resizeObserver.observe(currentElement);
        }
        return () => {
            if (currentElement) {
                resizeObserver.unobserve(currentElement);
            }
        };
    }, [containerRef.current]);

    const setRowHeight = (index: number, size: number) => {
        setRowHeights((r) => (r[index] === size ? r : { ...r, [index]: size }));
    };

    useEffect(() => {
        if (!listUpdateDebounceTimer.current) {
            listUpdateDebounceTimer.current = window.setTimeout(() => {
                listRef.current?.resetAfterIndex(0);
                listUpdateDebounceTimer.current = 0;
            });
        }
    }, [listRef.current, rowHeights]);

    return (
        <div ref={containerRef} style={style}>
            <ListContext.Provider
                value={{
                    items,
                    rowGenerator,
                    rowHeights,
                    setRowHeight,
                }}
            >
                <LargeList_List
                    listRef={listRef}
                    defaultRowSize={defaultRowSize}
                    ref={ref}
                    {...listDim}
                />
            </ListContext.Provider>
        </div>
    );
};

export default LargeList;
export type { RowGenerator };
