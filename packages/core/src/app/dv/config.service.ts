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

export interface UsedConceptsConfig {
  [conceptAlias: string]: { config: any };
}

export const USED_CONCEPTS_CONFIG = new InjectionToken<string>(
  'usedConceptsConfig'
);

// an abstract class is used so that we can export the type without
// worrying that somebody will accidentally try skipping the factory
export abstract class ConfigService {
  abstract getConfig(): any;
}

class AppConfigService extends ConfigService {
  constructor(
    private readonly usedConceptsConfig: UsedConceptsConfig,
    protected readonly forNode: ElementRef
  ) {
    super();
  }

  getConfig(): any {
    const alias = this.getConceptAlias();

    const usedConcept = _.get(this.usedConceptsConfig, alias);
    if (usedConcept === undefined) {
      throw new Error(`Concept ${alias} not found`);
    }

    return usedConcept.config;
  }

  protected getConceptAlias(): string {
    return NodeUtils.GetConceptAliasOfNode(this.forNode.nativeElement);
  }
}

class DesignerConfigService extends AppConfigService {
  constructor(
    usedConceptsConfig: UsedConceptsConfig,
    protected readonly forNode: ElementRef,
    private readonly renderer: Renderer2
  ) {
    super(usedConceptsConfig, forNode);
  }

  /**
   * The designer will always set the dvOf attribute on the element
   * which is an ancestor of the concept component.
   *
   * Note that this assumes a concept component that cares about the config
   *   is never used in another concept component.
   */
  protected getConceptAlias(): string {
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
    @Inject(USED_CONCEPTS_CONFIG)
    private readonly usedConceptsConfig: UsedConceptsConfig,
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
  createConfigService(forNode: ElementRef): ConfigService {
    if (window['dv-designer']) {
      return new DesignerConfigService(
        this.usedConceptsConfig, forNode, this.renderer);
    }

    return new AppConfigService(this.usedConceptsConfig, forNode);
  }
}
