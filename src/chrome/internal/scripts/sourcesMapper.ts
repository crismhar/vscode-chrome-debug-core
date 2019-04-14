/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { createColumnNumber, createLineNumber } from '../locations/subtypes';
import { SourceMap, SourceRange } from '../../../sourceMaps/sourceMap';
import { LocationInLoadedSource, LocationInScript, Position } from '../locations/location';
import { ILoadedSource } from '../sources/loadedSource';
import { IResourceIdentifier, parseResourceIdentifier } from '../sources/resourceIdentifier';
import { IScript } from './script';
import { IValidatedMap } from '../../collections/validatedMap';
import { logger } from 'vscode-debugadapter';
import { MappedTokensInScript, NoMappedTokensInScript, IMappedTokensInScript } from '../locations/mappedTokensInScript';
import { RangeInResource } from '../locations/rangeInScript';

export interface ISourceToScriptMapper {
    getPositionInScript(positionInSource: LocationInLoadedSource): IMappedTokensInScript;
}

export interface IScriptToSourceMapper {
    getPositionInSource(positionInScript: LocationInScript): LocationInLoadedSource;
}

export interface ISourceMapper extends ISourceToScriptMapper, IScriptToSourceMapper { }

export interface IMappedSourcesMapper extends ISourceMapper {
    readonly sources: string[];
}

/** This class maps locations from a script into the sources form which it was compiled, and back. */
export class MappedSourcesMapper implements IMappedSourcesMapper {
    private readonly _rangeInSources: IValidatedMap<IResourceIdentifier, SourceRange>;

    constructor(private readonly _script: IScript, private readonly _sourceMap: SourceMap) {
        this._rangeInSources = this._sourceMap.rangesInSources();
    }

    public getPositionInSource(positionInScript: LocationInScript): LocationInLoadedSource {
        const scriptPositionInResource = this._script.rangeInSource.start.position;

        // All the lines need to be adjusted by the relative position of the script in the resource (in an .html if the script starts in line 20, the first line is 20 rather than 0)
        const lineNumberRelativeToScript = positionInScript.position.lineNumber - scriptPositionInResource.lineNumber;

        // The columns on the first line need to be adjusted. Columns on all other lines don't need any adjustment.
        const columnNumberRelativeToScript = (lineNumberRelativeToScript === 0 ? scriptPositionInResource.columnNumber : 0) + (positionInScript.position.columnNumber || 0);

        const mappedPosition = this._sourceMap.authoredPositionFor(lineNumberRelativeToScript, columnNumberRelativeToScript);

        if (mappedPosition && mappedPosition.source && mappedPosition.line !== null && mappedPosition.column !== null) {
            const position = new Position(createLineNumber(mappedPosition.line), createColumnNumber(mappedPosition.column));
            const mappedResult = new LocationInLoadedSource(positionInScript.script.getSource(parseResourceIdentifier(mappedPosition.source)), position);
            logger.log(`SourceMapper: ${positionInScript} mapped to source: ${mappedResult}`);
            return mappedResult;
        } else {
            // If we couldn't map it, return the location in the development source
            const mappedResult = new LocationInLoadedSource(positionInScript.script.developmentSource, positionInScript.position);
            logger.log(`SourceMapper: ${positionInScript} couldn't be mapped to source so we'll return the development location: ${mappedResult}`);
            return mappedResult;
        }
    }

    public getPositionInScript(positionInSource: LocationInLoadedSource): IMappedTokensInScript {
        const range = this._rangeInSources.get(positionInSource.source.identifier);
        if (!Position.isBetween(range.start, positionInSource.position, range.end)) {
            // The range of this script in the source doesn't has the position, so there won't be any mapping
            logger.log(`SourceMapper: ${positionInSource} is outside the range of ${this._script} so it doesn't map anywhere`);
            return new NoMappedTokensInScript(this._script);
        }

        const manyMappedPositionRelativeToScript = this._sourceMap.allGeneratedPositionFor(positionInSource.source.identifier.textRepresentation,
            positionInSource.position.lineNumber, positionInSource.position.columnNumber || 0);

        const validPositions = manyMappedPositionRelativeToScript.filter(mappedPositionRelativeToScript => mappedPositionRelativeToScript && typeof mappedPositionRelativeToScript.line === 'number' && typeof mappedPositionRelativeToScript.column === 'number');

        const results = validPositions.map(mappedPositionRelativeToScript => {
            const scriptPositionInResource = this._script.rangeInSource.start.position;

            // All the lines need to be adjusted by the relative position of the script in the resource (in an .html if the script starts in line 20, the first line is 20 rather than 0)
            const lineNumberRelativeToEntireResource = createLineNumber(mappedPositionRelativeToScript.line! + scriptPositionInResource.lineNumber);

            // The columns on the first line need to be adjusted. Columns on all other lines don't need any adjustment.
            const columnNumberRelativeToEntireResource = createColumnNumber((mappedPositionRelativeToScript.line === 0 ? scriptPositionInResource.columnNumber : 0) + mappedPositionRelativeToScript.column!);
            const endColumnNumberRelativeToEntireResource = createColumnNumber((mappedPositionRelativeToScript.line === 0 ? scriptPositionInResource.columnNumber : 0) + (mappedPositionRelativeToScript.lastColumn || mappedPositionRelativeToScript.column!));

            const position = new Position(createLineNumber(lineNumberRelativeToEntireResource), createColumnNumber(columnNumberRelativeToEntireResource));
            const endPosition = new Position(createLineNumber(lineNumberRelativeToEntireResource), createColumnNumber(endColumnNumberRelativeToEntireResource));
            const mappingResult = new RangeInResource<IScript>(this._script, position, endPosition);
            logger.log(`SourceMapper: ${positionInSource} mapped to script: ${mappingResult}`);
            return mappingResult;
        });

        return new MappedTokensInScript(this._script, results);
    }

    public get sources(): string[] {
        return this._sourceMap.authoredSources || [];
    }

    public toString(): string {
        return `Mapped sources mapper of ${this._script} into ${this._script.mappedSources}`;
    }
}

export class NoMappedSourcesMapper implements IMappedSourcesMapper {
    constructor(private readonly _script: IScript) {

    }

    public getPositionInSource(positionInScript: LocationInScript): LocationInLoadedSource {
        return new LocationInLoadedSource(this._script.developmentSource, positionInScript.position);
    }

    public getPositionInScript(positionInSource: LocationInLoadedSource): IMappedTokensInScript {
        if (positionInSource.resource === this._script.developmentSource || positionInSource.resource === this._script.runtimeSource) {
            return MappedTokensInScript.characterAt(new LocationInScript(this._script, positionInSource.position));
        } else {
            throw new Error(`This source mapper can only map locations from the runtime or development scripts of ${this._script} yet the location provided was ${positionInSource}`);
        }
    }

    public get sources(): string[] {
        return [];
    }

    public toString(): string {
        return `No sources mapper of ${this._script}`;
    }
}

export class UnmappedSourceMapper implements ISourceMapper {
    constructor(private readonly _script: IScript, private readonly _source: ILoadedSource) { }

    public getPositionInSource(positionInScript: LocationInScript): LocationInLoadedSource {
        return new LocationInLoadedSource(this._source, positionInScript.position);
    }

    public getPositionInScript(positionInSource: LocationInLoadedSource): IMappedTokensInScript {
        return MappedTokensInScript.characterAt(new LocationInScript(this._script, positionInSource.position));
    }

    public toString(): string {
        return `Unmapped sources mapper of ${this._script}`;
    }
}
