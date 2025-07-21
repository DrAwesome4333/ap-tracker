import styled from "styled-components";

const CollectionContainer = styled.div<{
    $color: string;
}>`
    cursor: pointer;
    color: ${(props) => props.$color};
    &:hover {
        text-decoration: underline;
    }
`;

export default CollectionContainer;
