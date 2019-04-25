import {
  ElementRef,
  Inject,
  Injectable,
  InjectionToken,
  Renderer2,
  RendererFactory2
} from '@angular/core';
import * as _ from 'lodash';
import { NodeUtils, OF_ATTR } from './node.utils';

export interface UsedClichesConfig {
  [clicheAlias: string]: { config: any };
}

export const USED_CLICHES_CONFIG = new InjectionToken<string>(
  'usedClichesConfig'
);

// an abstract class is used so that we can export the type without
// worrying that somebody will accidentally try skipping the factory
export abstract class ConfigService {
  abstract getConfig(): any;
}

class AppConfigService implements ConfigService {
  constructor(
    private readonly usedClichesConfig: UsedClichesConfig,
    protected readonly forNode: ElementRef
  ) {}

  getConfig(): any {
    const alias = this.getClicheAlias();

    const usedCliche = _.get(this.usedClichesConfig, alias);
    if (usedCliche === undefined) {
      throw new Error(`Cliche ${alias} not found`);
    }

    return usedCliche.config;
  }

  protected getClicheAlias(): string {
    return NodeUtils.GetClicheAliasOfNode(this.forNode.nativeElement);
  }
}

class DesignerConfigService extends AppConfigService {
  constructor(
    usedClichesConfig: UsedClichesConfig,
    protected readonly forNode: ElementRef,
    private readonly renderer: Renderer2
  ) {
    super(usedClichesConfig, forNode);
  }

  /**
   * The designer will always set the dvOf attribute on the element
   * which is an ancestor of the cliche action.
   *
   * Note that this assumes a cliche action that cares about the config
   *   is never used in another cliche action.
   */
  protected getClicheAlias(): string {
    let dvOf: string;
    NodeUtils.WalkUpFromNode(
      this.forNode.nativeElement,
      this.renderer,
      () => !!dvOf,
      (node) => {
        dvOf = NodeUtils.GetAttribute(node, OF_ATTR);
      }
    );
    if (!dvOf) {
      const fqtag = NodeUtils.GetFqTagOfNode(this.forNode.nativeElement);
      throw new Error(`In designer, dvOf for ${fqtag} not found`);
    }

    return dvOf;
  }
}

@Injectable()
export class ConfigServiceFactory {
  private readonly renderer: Renderer2;

  constructor(
    @Inject(USED_CLICHES_CONFIG)
      private readonly usedClichesConfig: UsedClichesConfig,
    rendererFactory: RendererFactory2
  ) {
    // https://github.com/angular/angular/issues/17824
    // It seems like while you can get Renderer2 injected in components it
    // doesn't work for services. The workaround is to get the factory injected
    // and use it to create a renderer.
    // If you pass null null to `createRenderer` it returns the default renderer
    // without creating a new one
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  // This method should be called onInit (or after)
  // Calling `for` in before onInit can cause problems because the component
  // might not be attached to the dom (thus making it impossible to find the
  // parents of the from element).
  // TODO: I think this is the problem but I should investigate more
  createConfigService(forNode: ElementRef): ConfigService {
    if (window['dv-designer']) {
      return new DesignerConfigService(
        this.usedClichesConfig, forNode, this.renderer);
    }

    return new AppConfigService(this.usedClichesConfig, forNode);
  }
}
