import { Tree } from '../src/tree';
import { TreeModel, TreeModelSettings, FoldingType } from '../src/tree.types';

describe('Tree', () => {
  it('should detect empty string', () => {
    expect(Tree.isValueEmpty('  ')).toBe(true);
    expect(Tree.isValueEmpty(' \n \r ')).toBe(true);
    expect(Tree.isValueEmpty('\r')).toBe(true);
    expect(Tree.isValueEmpty(' \t ')).toBe(true);
    expect(Tree.isValueEmpty('  ')).toBe(true);

    expect(Tree.isValueEmpty('42')).toBe(false);
    expect(Tree.isValueEmpty(' 42  \n')).toBe(false);
    expect(Tree.isValueEmpty(' 42')).toBe(false);
    expect(Tree.isValueEmpty('42 ')).toBe(false);
  });

  it('should be able to apply value to Renamable node', () => {
    const renamableNode = {
      name: '42',
      age: 'millions years',
      setName(value: string): void {
        this.name = value;
      },
      toString(): string {
        return this.name;
      }
    };

    const tree = new Tree({ value: renamableNode });

    tree.value = '12';
    expect(tree.value.toString()).toEqual('12');
    expect((tree.value as any).age).toEqual(renamableNode.age);
  });

  it('should be able to apply value to Renamable node: value might be another renamable node coerced to string', () => {
    const renamableNode = {
      name: '42',
      age: 'millions years',
      setName: function (value) {
        this.name = value;
      },
      toString: function () {
        return this.name;
      }
    };

    const tree = new Tree({ value: renamableNode });

    tree.value = { setName: () => { }, toString: () => 'Hi!' };
    expect(tree.value.toString()).toEqual('Hi!');
  });

  it('should be able to apply value to regular node', () => {
    const tree = new Tree({ value: 'bla' });

    tree.value = '12';
    expect(tree.value).toEqual('12');
  });

  it('assigns only RenamableNodes and strings as values', () => {
    const tree = new Tree({ value: 'bla' });

    tree.value = ['boo!'];
    expect(tree.value).toEqual('bla');
  });

  it('should not apply value if it is empty', () => {
    const tree = new Tree({ value: 'bla' });

    tree.value = '';
    expect(tree.value).toEqual('bla');

    tree.value = ' ';
    expect(tree.value).toEqual('bla');

    tree.value = ' \n\r\t';
    expect(tree.value).toEqual('bla');
  });

  it('should know how to detect Renamable node', () => {
    const renamableNode = {
      setName: () => { },
      toString: () => { }
    };

    const renamableNodeImposter = {
      setName: 42,
      toString: 'bla'
    };

    const regularNode = {
      value: 42
    };

    expect(Tree.isRenamable(renamableNode)).toBe(true);
    expect(Tree.isRenamable(renamableNodeImposter)).toBe(false);
    expect(Tree.isRenamable(regularNode)).toBe(false);
  });

  it('should build a Tree from TreeModel', () => {
    const fonts: TreeModel = {
      value: 'Serif  -  All my children and I are STATIC ¯\\_(ツ)_/¯',
      children: [
        { value: 'Antiqua' },
        { value: 'DejaVu Serif' },
        { value: 'Garamond' },
        { value: 'Georgia' },
        { value: 'Times New Roman' },
        {
          value: 'Slab serif',
          children: [
            { value: 'Candida' },
            { value: 'Swift' },
            { value: 'Guardian Egyptian' }
          ]
        }
      ]
    };

    const tree = new Tree(fonts);
    expect(tree).not.toBeFalsy('Constructed tree should exist');
    expect(tree instanceof Tree).toBe(true, 'tree should be instance of Tree');
    expect(tree.value).toEqual(fonts.value);
    expect(tree.children.length).toEqual(6);
    expect(tree.children[0].value).toEqual('Antiqua');
    expect(tree.children[0].positionInParent).toEqual(0);

    const slabSerifFontsTree = tree.children[5];
    expect(slabSerifFontsTree.value).toEqual('Slab serif');
    expect(slabSerifFontsTree.children.length).toEqual(3);
    expect(slabSerifFontsTree.children[1].value).toEqual('Swift');
    expect(slabSerifFontsTree.children[1].positionInParent).toEqual(1);
  });

  it('builds completely new structure from TreeModel and changes to TreeModel should not affect built Tree', () => {
    const fonts: TreeModel = {
      value: 'Serif  -  All my children and I are STATIC ¯\\_(ツ)_/¯',
      children: [
        { value: 'Antiqua' },
        { value: 'DejaVu Serif' },
        { value: 'Garamond' },
        { value: 'Georgia' },
        { value: 'Times New Roman' },
      ]
    };

    const tree = new Tree(fonts);

    fonts.children[0].value = 'bla';

    expect(fonts.children[0].value).toEqual('bla');
    expect(tree.children[0].value).toEqual('Antiqua');
  });

  it('merges TreeModelSettings during Tree construction from TreeModel', () => {
    const fonts: TreeModel = {
      value: 'Serif  -  All my children and I are STATIC ¯\\_(ツ)_/¯',
      children: [
        { value: 'Antiqua' },
        { value: 'DejaVu Serif' },
        { value: 'Garamond' },
        { value: 'Georgia' },
        { value: 'Times New Roman' },
      ]
    };

    spyOn(TreeModelSettings, 'merge');

    new Tree(fonts);

    expect(TreeModelSettings.merge).toHaveBeenCalledTimes(6);
    expect(TreeModelSettings.merge).toHaveBeenCalledWith(fonts, undefined);
  });

  it('adds child', () => {
    const fonts: TreeModel = {
      value: 'Serif  -  All my children and I are STATIC ¯\\_(ツ)_/¯',
      children: [
        { value: 'Antiqua' },
        { value: 'DejaVu Serif' },
        { value: 'Garamond' },
        { value: 'Georgia' },
        { value: 'Times New Roman' },
      ]
    };

    const tree = new Tree(fonts);
    const child = new Tree({
      value: 'Master', children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' },
      ]
    });

    const addedChild = tree.addChild(child);

    expect(addedChild === child).toBe(false);
    expect(addedChild.positionInParent).toEqual(5);
    expect(addedChild.parent).toBe(tree);
  });

  it('adds child and shallowly clones its TreeModel', () => {
    const fonts: TreeModel = {
      value: 'Serif  -  All my children and I are STATIC ¯\\_(ツ)_/¯',
      children: [
        { value: 'Antiqua' },
        { value: 'DejaVu Serif' },
        { value: 'Garamond' },
        { value: 'Georgia' },
        { value: 'Times New Roman' },
      ]
    };

    const tree = new Tree(fonts);
    const child = new Tree({ value: 'Master' });

    const addedChild = tree.addChild(child);
    addedChild.value = 'Boo!';

    expect(addedChild.value).toEqual('Boo!');
    expect(child.value).toEqual('Master');
  });

  it('adds child to a particular position in a tree', () => {
    const fonts: TreeModel = {
      value: 'Serif  -  All my children and I are STATIC ¯\\_(ツ)_/¯',
      children: [
        { value: 'Antiqua' },
        { value: 'DejaVu Serif' },
        { value: 'Garamond' },
        { value: 'Georgia' },
        { value: 'Times New Roman' },
      ]
    };

    const tree = new Tree(fonts);
    const servantTree = new Tree({
      value: 'Master',
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    const addedChild = tree.addChild(servantTree, 0);

    expect(tree.children.length).toEqual(6);
    expect(addedChild.positionInParent).toEqual(0);
    expect(tree.children[0].value).toEqual('Master');
  });

  it('adds child to tree with no children at creation moment', () => {
    const tree = new Tree({
      value: 'Recipient',
    });

    const servantTree = new Tree({
      value: 'Master',
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    const addedChild = tree.addChild(servantTree);

    expect(tree.children.length).toEqual(1);
    expect(tree.children[0].value).toEqual('Master');
    expect(addedChild.positionInParent).toEqual(0);
    expect(addedChild.children.length).toEqual(2);
    expect(addedChild.children[1].value).toEqual('Servant#2');
  });

  it('adds child to tree with a not array children property', () => {
    const tree = new Tree({
      value: 'Recipient',
      children: null
    });

    const servantTree = new Tree({
      value: 'Master',
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    const addedChild = tree.addChild(servantTree);

    expect(tree.children.length).toEqual(1);
    expect(tree.children[0].value).toEqual('Master');
    expect(addedChild.positionInParent).toEqual(0);
    expect(addedChild.children.length).toEqual(2);
    expect(addedChild.children[1].value).toEqual('Servant#2');
  });

  it('cannot add sibling if there is no parent: root node', () => {
    const tree = new Tree({
      value: 'Recipient',
      children: null
    });

    const addedSibling = tree.addSibling(new Tree({value: 'bla'}));

    expect(addedSibling).toBeNull();
    expect(tree.parent).toBeNull();
  });

  it('creates child node (leaf)', () => {
    const servantTree = new Tree({
      value: 'Master',
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    const child = servantTree.createNode(false);

    expect(servantTree.hasChild(child)).toEqual(true);
    expect(child.value).toEqual('');
    expect(child.children).toEqual(null);
    expect(child.isLeaf()).toEqual(true);
    expect(child.isNew()).toEqual(true);
    expect(child.positionInParent).toEqual(2);
  });

  it('creates sibling node (leaf)', () => {
    const servantTree = new Tree({
      value: 'Master',
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    const servantNumber1Tree = servantTree.children[0];
    expect(servantNumber1Tree.value).toEqual('Servant#1');

    const sibling = servantNumber1Tree.createNode(false);

    expect(servantTree.hasChild(sibling)).toEqual(true);
    expect(sibling.value).toEqual('');
    expect(sibling.children).toEqual(null);
    expect(sibling.isLeaf()).toEqual(true);
    expect(sibling.isNew()).toEqual(true);
    expect(sibling.positionInParent).toEqual(2);
  });

  it('creates child node (branch)', () => {
    const servantTree = new Tree({
      value: 'Master',
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    const child = servantTree.createNode(true);

    expect(servantTree.hasChild(child)).toEqual(true);
    expect(child.value).toEqual('');
    expect(child.children).toEqual([]);
    expect(child.isBranch()).toEqual(true);
    expect(child.isNew()).toEqual(true);
    expect(child.positionInParent).toEqual(2);
  });

  it('creates static tree', () => {
    const servantTree = new Tree({
      value: 'Master',
      settings: { 'static': true },
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    expect(servantTree.isStatic()).toEqual(true);
  });

  it('creates non-static tree by default', () => {
    const servantTree = new Tree({
      value: 'Master',
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    expect(servantTree.isStatic()).toEqual(false);
    expect(servantTree.children[0].isStatic()).toEqual(false);
    expect(servantTree.children[1].isStatic()).toEqual(false);
  });

  it('creates static tree and makes all children static as well', () => {
    const servantTree = new Tree({
      value: 'Master',
      settings: { 'static': true },
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    expect(servantTree.isStatic()).toEqual(true);
    expect(servantTree.children[0].isStatic()).toEqual(true);
    expect(servantTree.children[1].isStatic()).toEqual(true);
  });

  it('creates static tree and makes all children static as well: children can override static option', () => {
    const servantTree = new Tree({
      value: 'Master',
      settings: { 'static': true },
      children: [
        { value: 'Servant#1', settings: { 'static': false } },
        { value: 'Servant#2' }
      ]
    });

    expect(servantTree.isStatic()).toEqual(true);
    expect(servantTree.children[0].isStatic()).toEqual(false);
    expect(servantTree.children[1].isStatic()).toEqual(true);
  });

  it('knows that it is branch', () => {
    const servantTree = new Tree({
      value: 'Master',
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    expect(servantTree.isLeaf()).toEqual(false);
    expect(servantTree.isBranch()).toEqual(true);
  });

  it('knows that it is leaf', () => {
    const servantTree = new Tree({
      value: 'Master'
    });

    expect(servantTree.isLeaf()).toEqual(true);
    expect(servantTree.isBranch()).toEqual(false);
  });

  it('knows that it is root', () => {
    const servantTree = new Tree({
      value: 'Master',
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    expect(servantTree.isRoot()).toEqual(true);
    expect(servantTree.children[0].isRoot()).toEqual(false);
    expect(servantTree.children[1].isRoot()).toEqual(false);
  });

  it('knows its siblings', () => {
    const masterTree = new Tree({
      value: 'Master',
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    const servantNumber1Tree = masterTree.children[0];
    const servantNumber2Tree = masterTree.children[1];

    expect(masterTree.hasSibling(servantNumber1Tree)).toEqual(false);
    expect(servantNumber1Tree.hasSibling(servantNumber1Tree)).toEqual(true);
    expect(servantNumber1Tree.hasSibling(servantNumber2Tree)).toEqual(true);
    expect(servantNumber2Tree.hasSibling(servantNumber1Tree)).toEqual(true);
  });

  it('knows its children', () => {
    const masterTree = new Tree({
      value: 'Master',
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    const servantNumber1Tree = masterTree.children[0];
    const servantNumber2Tree = masterTree.children[1];
    const imposter = new Tree({ value: 'HA-HA-HA!!!' });

    expect(masterTree.hasChild(servantNumber1Tree)).toEqual(true);
    expect(masterTree.hasChild(servantNumber2Tree)).toEqual(true);
    expect(masterTree.hasChild(imposter)).toEqual(false);
    expect(servantNumber2Tree.hasChild(masterTree)).toEqual(false);
    expect(servantNumber1Tree.hasChild(servantNumber2Tree)).toEqual(false);
  });

  it('can remove children', () => {
    const masterTree = new Tree({
      value: 'Master',
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    const servantNumber1Tree = masterTree.children[0];
    const servantNumber2Tree = masterTree.children[1];

    masterTree.removeChild(servantNumber2Tree);

    expect(masterTree.hasChild(servantNumber2Tree)).toEqual(false);
    expect(masterTree.children.length).toEqual(1);
    expect(masterTree.children[0]).toBe(servantNumber1Tree);
  });

  it('cannot remove node that is not a child', () => {
    const masterTree = new Tree({
      value: 'Master',
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    const imposter = new Tree({ value: 'HA-HA-HA!!!' });

    masterTree.removeChild(imposter);

    expect(masterTree.children.length).toEqual(2);
    expect(masterTree.children[0].value).toEqual('Servant#1');
    expect(masterTree.children[1].value).toEqual('Servant#2');
  });

  it('can remove itself from parent', () => {
    const masterTree = new Tree({
      value: 'Master',
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    const servantNumber1Tree = masterTree.children[0];
    const servantNumber2Tree = masterTree.children[1];

    servantNumber2Tree.removeItselfFromParent();

    expect(masterTree.hasChild(servantNumber2Tree)).toEqual(false);
    expect(masterTree.children.length).toEqual(1);
    expect(masterTree.children[0]).toBe(servantNumber1Tree);
  });

  it('should do nothing when some tries to remove a tree without a parent from parent simply cause it hasn\'t parent', () => {
    const masterTree = new Tree({
      value: 'Master'
    });

    masterTree.removeItselfFromParent();
  });

  it('can swap its position in parent with sibling', () => {
    const masterTree = new Tree({
      value: 'Master',
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    const servantNumber1Tree = masterTree.children[0];
    const servantNumber2Tree = masterTree.children[1];

    expect(servantNumber1Tree.positionInParent).toEqual(0);
    expect(servantNumber2Tree.positionInParent).toEqual(1);

    servantNumber1Tree.swapWithSibling(servantNumber2Tree);

    expect(servantNumber1Tree.positionInParent).toEqual(1);
    expect(servantNumber2Tree.positionInParent).toEqual(0);
  });

  it('cannot swap its position in parent with node that is not its sibling', () => {
    const masterTree = new Tree({
      value: 'Master',
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    const imposter = new Tree({ value: 'HA-HA-HA!!!' });

    const servantNumber1Tree = masterTree.children[0];
    const servantNumber2Tree = masterTree.children[1];

    expect(servantNumber1Tree.positionInParent).toEqual(0);
    expect(servantNumber2Tree.positionInParent).toEqual(1);

    servantNumber1Tree.swapWithSibling(imposter);

    expect(servantNumber1Tree.positionInParent).toEqual(0);
    expect(servantNumber2Tree.positionInParent).toEqual(1);
  });

  it('has "Leaf" folding type if it is leaf (by default for leaves)', () => {
    const masterTree = new Tree({
      value: 'Master'
    });

    expect(masterTree.isLeaf()).toEqual(true);
    expect(masterTree.isNodeExpanded()).toEqual(false);
    expect(masterTree.foldingType).toEqual(FoldingType.Leaf);
  });

  it('cannot switch "Leaf" folding type', () => {
    const masterTree = new Tree({
      value: 'Master'
    });

    expect(masterTree.foldingType).toEqual(FoldingType.Leaf);

    masterTree.switchFoldingType();

    expect(masterTree.foldingType).toEqual(FoldingType.Leaf);
  });

  it('has "Expanded" folding type if it is branch and expanded (by default for branches)', () => {
    const masterTree = new Tree({
      value: 'Master',
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    expect(masterTree.isBranch()).toEqual(true);
    expect(masterTree.isNodeExpanded()).toEqual(true);
    expect(masterTree.foldingType).toEqual(FoldingType.Expanded);
  });

  it('can switch "Branch" folding type', () => {
    const masterTree = new Tree({
      value: 'Master',
      children: [
        { value: 'Servant#1' },
        { value: 'Servant#2' }
      ]
    });

    expect(masterTree.foldingType).toEqual(FoldingType.Expanded);
    expect(masterTree.isNodeExpanded()).toEqual(true);

    masterTree.switchFoldingType();

    expect(masterTree.foldingType).toEqual(FoldingType.Collapsed);
    expect(masterTree.isNodeExpanded()).toEqual(false);

    masterTree.switchFoldingType();

    expect(masterTree.foldingType).toEqual(FoldingType.Expanded);
    expect(masterTree.isNodeExpanded()).toEqual(true);
  });

  it('has undefined status by default', () => {
    const masterTree = new Tree({
      value: 'Master'
    });

    expect(masterTree.isNew()).toEqual(false);
    expect(masterTree.isBeingRenamed()).toEqual(false);
    expect(masterTree.isModified()).toEqual(false);
  });

  it('can be marked as new', () => {
    const masterTree = new Tree({ value: 'Master' });

    masterTree.markAsNew();
    expect(masterTree.isNew()).toEqual(true);
  });

  it('can be marked as modified', () => {
    const masterTree = new Tree({ value: 'Master' });

    masterTree.markAsModified();
    expect(masterTree.isModified()).toEqual(true);
  });

  it('can be marked as being renamed', () => {
    const masterTree = new Tree({ value: 'Master' });

    masterTree.markAsBeingRenamed();
    expect(masterTree.isBeingRenamed()).toEqual(true);
  });

  it('can load its children asynchronously', (done: Function) => {
    const tree = new Tree({
      value: 'AsyncParent',
      loadChildren: (callback: Function) => {
        setTimeout(() => {
          callback([
            { value: 'Child#1' },
            { value: 'Child#2' }
          ]);
        }, 10);
      }
    });

    tree.switchFoldingType();
    tree.childrenAsync.subscribe((children: Tree[]) => {
      expect(tree.children.length).toEqual(2);
      expect(tree.children[0].value).toEqual(children[0].value);
      expect(tree.children[1].value).toEqual(children[1].value);
      done();
    });
  });

  it('can load its children asynchronously: loads children only once', (done: Function) => {
    let loadCount = 0;
    const tree = new Tree({
      value: 'AsyncParent',
      loadChildren: (callback: Function) => {
        loadCount++;
        setTimeout(() => {
          callback([
            { value: 'Child#1' },
            { value: 'Child#2' }
          ]);
        }, 10);
      }
    });

    tree.switchFoldingType();
    tree.childrenAsync.subscribe(() => {
      tree.childrenAsync.subscribe((children: Tree[]) => {
        expect(loadCount).toEqual(1, 'children should be loaded only once');
        expect(tree.children.length).toEqual(2);
        expect(tree.children[0].value).toEqual(children[0].value);
        expect(tree.children[1].value).toEqual(children[1].value);
        done();
      });
    });
  });

  it('can load its children asynchronously: node with async children should be collapsed by defualt', () => {
    const tree = new Tree({
      value: 'AsyncParent',
      loadChildren: (callback: Function) => {
        setTimeout(() => {
          callback([
            { value: 'Child#1' },
            { value: 'Child#2' }
          ]);
        }, 10);
      }
    });

    expect(tree.foldingType).toEqual(FoldingType.Collapsed);
  });
});