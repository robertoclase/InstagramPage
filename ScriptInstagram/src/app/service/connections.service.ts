import { Injectable } from '@angular/core';
import JSZip, { JSZipObject } from 'jszip';
import {
  ComparisonResult,
  ProfileHandle,
  RawFollowersPayload,
  RawFollowingPayload,
  RawProfileBucket,
  StringListEntry
} from '../model/profile.model';

@Injectable({ providedIn: 'root' })
export class ConnectionsService {
  async extractProfilesFromArchive(arrayBuffer: ArrayBuffer): Promise<{ followers: ProfileHandle[]; following: ProfileHandle[] }> {
    const zip = await JSZip.loadAsync(arrayBuffer);

    const followersEntry = this.findZipEntry(zip, ['followers_1.json', 'followers.json']);
    const followingEntry = this.findZipEntry(zip, ['following.json', 'following_1.json']);

    if (!followersEntry) {
      throw new Error('No se encontró followers_1.json dentro del ZIP.');
    }

    if (!followingEntry) {
      throw new Error('No se encontró following.json dentro del ZIP.');
    }

    const [followersRaw, followingRaw] = await Promise.all([
      followersEntry.async('string'),
      followingEntry.async('string')
    ]);

    return {
      followers: this.parseFollowersJson(followersRaw),
      following: this.parseFollowingJson(followingRaw)
    };
  }

  parseFollowersJson(rawText: string): ProfileHandle[] {
    const parsed = this.safeJsonParse(rawText);

    if (Array.isArray(parsed)) {
      return this.normalize(parsed as RawFollowersPayload);
    }

    if (Array.isArray((parsed as { relationships_followers?: RawProfileBucket[] })?.relationships_followers)) {
      return this.normalize((parsed as { relationships_followers: RawProfileBucket[] }).relationships_followers);
    }

    throw new Error('El archivo de seguidores no tiene el formato esperado.');
  }

  parseFollowingJson(rawText: string): ProfileHandle[] {
    const parsed = this.safeJsonParse(rawText);

    if (Array.isArray(parsed)) {
      return this.normalize(parsed as RawProfileBucket[]);
    }

    if (Array.isArray((parsed as RawFollowingPayload)?.relationships_following)) {
      return this.normalize((parsed as RawFollowingPayload).relationships_following);
    }

    throw new Error('El archivo de seguidos no tiene el formato esperado.');
  }

  compareProfiles(followers: ProfileHandle[], following: ProfileHandle[]): ComparisonResult {
    const followerMap = this.mapByUsername(followers);
    const followingMap = this.mapByUsername(following);

    const followerSet = new Set(Array.from(followerMap.keys()));
    const followingSet = new Set(Array.from(followingMap.keys()));

    const fans = Array.from(followerMap.entries())
      .filter(([username]) => !followingSet.has(username))
      .map(([, profile]) => profile);

    const perros = Array.from(followingMap.entries())
      .filter(([username]) => !followerSet.has(username))
      .map(([, profile]) => profile);

    const mutuals = Array.from(followerMap.keys()).filter((username) => followingSet.has(username)).length;

    return {
      followers: Array.from(followerMap.values()),
      following: Array.from(followingMap.values()),
      fans,
      perros,
      mutuals
    };
  }

  private normalize(buckets: RawProfileBucket[]): ProfileHandle[] {
    const flattened = buckets.flatMap((bucket) => this.extractFromBucket(bucket));
    return this.uniqueByUsername(flattened);
  }

  private extractFromBucket(bucket: RawProfileBucket): ProfileHandle[] {
    const entries: StringListEntry[] = bucket?.string_list_data ?? [];

    return entries
      .filter((entry): entry is StringListEntry => Boolean(entry?.value))
      .map((entry) => ({
        username: entry.value.trim(),
        url: entry.href ?? `https://www.instagram.com/${entry.value.trim()}`,
        timestamp: entry.timestamp
      }));
  }

  private uniqueByUsername(profiles: ProfileHandle[]): ProfileHandle[] {
    const map = this.mapByUsername(profiles);
    return Array.from(map.values());
  }

  private findZipEntry(zip: JSZip, candidateNames: string[]): JSZipObject | undefined {
    const normalizedCandidates = candidateNames.map((name) => name.toLowerCase());

    return Object.values(zip.files).find((entry) => {
      if (entry.dir) {
        return false;
      }

      const normalized = entry.name.replace(/\\/g, '/').toLowerCase();
      return normalizedCandidates.some((candidate) => normalized.endsWith(candidate));
    });
  }

  private mapByUsername(profiles: ProfileHandle[]): Map<string, ProfileHandle> {
    const map = new Map<string, ProfileHandle>();
    profiles.forEach((profile) => {
      const key = profile.username.toLowerCase();
      map.set(key, profile);
    });
    return map;
  }

  private safeJsonParse(rawText: string): unknown {
    try {
      return JSON.parse(rawText);
    } catch (error) {
      throw new Error('El archivo no contiene un JSON válido.');
    }
  }
}
