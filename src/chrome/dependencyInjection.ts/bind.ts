import { Container } from 'inversify';
import { TYPES } from './types';
import { IDOMInstrumentationBreakpoints, CDTPDOMDebugger } from '../target/cdtpSmallerModules';
import { IEventsToClientReporter, EventSender } from '../client/eventSender';
import { IDebugeeExecutionControl, ControlDebugeeExecution } from '../target/controlDebugeeExecution';
import { IPauseOnExceptions, IAsyncDebuggingConfiguration, IScriptSources, CDTPDebugger } from '../target/cdtpDebugger';
import { IBreakpointFeaturesSupport, BreakpointFeaturesSupport } from '../target/breakpointFeaturesSupport';
import { IStackTracePresentationLogicProvider, StackTracesLogic } from '../internal/stackTraces/stackTracesLogic';
import { ChromeDebugLogic, LineColTransformer } from '../..';
import { CDTPStackTraceParser } from '../target/cdtpStackTraceParser';
import { CDTPLocationParser } from '../target/cdtpLocationParser';
import { SourcesLogic } from '../internal/sources/sourcesLogic';
import { CDTPScriptsRegistry } from '../target/cdtpScriptsRegistry';
import { ClientToInternal } from '../client/clientToInternal';
import { InternalToClient } from '../client/internalToClient';
import { BreakpointsLogic } from '../internal/breakpoints/breakpointsLogic';
import { PauseOnExceptionOrRejection } from '../internal/exceptions/pauseOnException';
import { Stepping } from '../internal/stepping/stepping';
import { DotScriptCommand } from '../internal/sources/features/dotScriptsCommand';
import { BreakpointsRegistry } from '../internal/breakpoints/breakpointsRegistry';
import { ReAddBPsWhenSourceIsLoaded } from '../internal/breakpoints/features/reAddBPsWhenSourceIsLoaded';
import { PauseScriptLoadsToSetBPs } from '../internal/breakpoints/features/pauseScriptLoadsToSetBPs';
import { BPRecipieInLoadedSourceLogic } from '../internal/breakpoints/bpRecipieInLoadedSourceLogic';
import { CDTPDiagnostics } from '../target/cdtpDiagnostics';
import { DeleteMeScriptsRegistry } from '../internal/scripts/scriptsRegistry';
import { SyncStepping } from '../internal/stepping/features/syncStepping';
import { AsyncStepping } from '../internal/stepping/features/asyncStepping';
import { BreakpointIdRegistry } from '../target/breakpointIdRegistry';
import { ExceptionThrownEventProvider } from '../target/exceptionThrownEventProvider';
import { ExecutionContextEventsProvider } from '../target/executionContextEventsProvider';
import { IInspectDebugeeState, InspectDebugeeState } from '../target/inspectDebugeeState';
import { IUpdateDebugeeState, UpdateDebugeeState } from '../target/updateDebugeeState';
import { SmartStepLogic } from '../internal/features/smartStep';

export function bindAll(di: Container) {
    di.bind<IDOMInstrumentationBreakpoints>(TYPES.IDOMInstrumentationBreakpoints).to(CDTPDOMDebugger);
    di.bind<IAsyncDebuggingConfiguration>(TYPES.IAsyncDebuggingConfiguration).to(CDTPDebugger);
    di.bind<IScriptSources>(TYPES.IScriptSources).to(CDTPDebugger);

    di.bind<IStackTracePresentationLogicProvider>(TYPES.IStackTracePresentationLogicProvider).to(SmartStepLogic);
    // TODO DIEGO: di.bind<IStackTracePresentationLogicProvider>(TYPES.IStackTracePresentationLogicProvider).to(SkipFilesLogic);

    di.bind<IEventsToClientReporter>(TYPES.IEventsToClientReporter).to(EventSender);
    di.bind<IDebugeeExecutionControl>(TYPES.IDebugeeExecutionControl).to(ControlDebugeeExecution);
    di.bind<IPauseOnExceptions>(TYPES.IPauseOnExceptions).to(CDTPDebugger);
    di.bind<IBreakpointFeaturesSupport>(TYPES.IBreakpointFeaturesSupport).to(BreakpointFeaturesSupport);
    di.bind<IInspectDebugeeState>(TYPES.IInspectDebugeeState).to(InspectDebugeeState);
    di.bind<IUpdateDebugeeState>(TYPES.IUpdateDebugeeState).to(UpdateDebugeeState);
    di.bind<CDTPStackTraceParser>(TYPES.CDTPStackTraceParser).to(CDTPStackTraceParser);
    di.bind<CDTPLocationParser>(TYPES.CDTPLocationParser).to(CDTPLocationParser);
    di.bind<ChromeDebugLogic>(TYPES.ChromeDebugLogic).to(ChromeDebugLogic);
    di.bind<SourcesLogic>(TYPES.SourcesLogic).to(SourcesLogic);
    di.bind<CDTPScriptsRegistry>(TYPES.CDTPScriptsRegistry).to(CDTPScriptsRegistry);
    di.bind<ClientToInternal>(TYPES.ClientToInternal).to(ClientToInternal);
    di.bind<InternalToClient>(TYPES.InternalToClient).to(InternalToClient);
    di.bind<StackTracesLogic>(TYPES.StackTracesLogic).to(StackTracesLogic);
    di.bind<BreakpointsLogic>(TYPES.BreakpointsLogic).to(BreakpointsLogic);
    di.bind<PauseOnExceptionOrRejection>(TYPES.PauseOnExceptionOrRejection).to(PauseOnExceptionOrRejection);
    di.bind<Stepping>(TYPES.Stepping).to(Stepping);
    di.bind<DotScriptCommand>(TYPES.DotScriptCommand).to(DotScriptCommand);
    di.bind<CDTPDebugger>(TYPES.CDTPDebugger).to(CDTPDebugger);
    di.bind<BreakpointsRegistry>(TYPES.BreakpointsRegistry).to(BreakpointsRegistry);
    di.bind<ReAddBPsWhenSourceIsLoaded>(TYPES.ReAddBPsWhenSourceIsLoaded).to(ReAddBPsWhenSourceIsLoaded);
    di.bind<PauseScriptLoadsToSetBPs>(TYPES.PauseScriptLoadsToSetBPs).to(PauseScriptLoadsToSetBPs);
    di.bind<BPRecipieInLoadedSourceLogic>(TYPES.BPRecipieInLoadedSourceLogic).to(BPRecipieInLoadedSourceLogic);
    di.bind<EventSender>(TYPES.EventSender).to(EventSender);
    di.bind<CDTPDiagnostics>(TYPES.CDTPDiagnostics).to(CDTPDiagnostics);
    di.bind<DeleteMeScriptsRegistry>(TYPES.DeleteMeScriptsRegistry).to(DeleteMeScriptsRegistry);
    // di.bind<BaseSourceMapTransformer>(TYPES.BaseSourceMapTransformer).to(BaseSourceMapTransformer);
    // di.bind<BasePathTransformer>(TYPES.BasePathTransformer).to(BasePathTransformer);
    di.bind<SyncStepping>(TYPES.SyncStepping).to(SyncStepping);
    di.bind<AsyncStepping>(TYPES.AsyncStepping).to(AsyncStepping);
    di.bind<BreakpointIdRegistry>(TYPES.BreakpointIdRegistry).to(BreakpointIdRegistry);
    di.bind<ExceptionThrownEventProvider>(TYPES.ExceptionThrownEventProvider).to(ExceptionThrownEventProvider);
    di.bind<ExecutionContextEventsProvider>(TYPES.ExecutionContextEventsProvider).to(ExecutionContextEventsProvider);
    di.bind<LineColTransformer>(TYPES.LineColTransformer).to(LineColTransformer);
}