/** @jsx jsx */
import { jsx, css } from '@emotion/react';
import React, { useState } from "react";

const sectionStyle = css`
    position: relative;
    margin-bottom: 0.5rem;

    h3 {
        color: #efffe9;
    }

    > button {
        border: none;
        background: none;
        color: inherit;
        font-size: inherit;
        margin: 0;
        padding: 0;
        cursor: pointer;
    }
`;

export function CollapsableSection({title, children, defaultOpen = false}) {
    const [collapsed, setCollapsed] = useState(!defaultOpen);

    return (
        <div css={sectionStyle}>
            <button onClick={() => setCollapsed(!collapsed)}>
                <h3>{title} {collapsed ? '+' : '-'}</h3>
            </button>
            <div style={{display: collapsed ? 'none' : 'block'}}>
                {children}
            </div>
        </div>
    )
}